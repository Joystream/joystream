import { DatabaseManager, SubstrateEvent } from '@joystream/hydra-common'
import {
  DistributionBucketFamilyMetadata as DistributionBucketFamilyMetadataProto,
  DistributionBucketOperatorMetadata as DistributionBucketOperatorMetadataProto,
  GeographicalArea as GeographicalAreaProto,
  INodeLocationMetadata,
  INodeOperationalStatusMetadata,
  NodeOperationalStatusMetadata,
  StorageBucketOperatorMetadata as StorageBucketOperatorMetadataProto,
} from '@joystream/metadata-protobuf'
import { isEmptyObject, isSet, isValidCountryCode, isValidSubdivisionCode } from '@joystream/metadata-protobuf/utils'
import { Bytes } from '@polkadot/types'
import _ from 'lodash'
import {
  Continent,
  DistributionBucketFamilyGeographicArea,
  DistributionBucketFamilyMetadata,
  DistributionBucketOperatorMetadata,
  GeoCoordinates,
  GeographicalAreaContinent,
  GeographicalAreaCountry,
  GeographicalAreaSubdivistion,
  NodeLocationMetadata,
  NodeOperationalStatus,
  NodeOperationalStatusNoService,
  NodeOperationalStatusNoServiceDuring,
  NodeOperationalStatusNoServiceFrom,
  NodeOperationalStatusNormal,
  StorageBucketOperatorMetadata,
} from 'query-node/dist/model'
import { deserializeMetadata, deterministicEntityId, invalidMetadata } from '../common'

const protobufContinentToGraphlContinent: { [key in GeographicalAreaProto.Continent]: Continent } = {
  [GeographicalAreaProto.Continent.AF]: Continent.AF,
  [GeographicalAreaProto.Continent.AN]: Continent.AN,
  [GeographicalAreaProto.Continent.AS]: Continent.AS,
  [GeographicalAreaProto.Continent.EU]: Continent.EU,
  [GeographicalAreaProto.Continent.NA]: Continent.NA,
  [GeographicalAreaProto.Continent.OC]: Continent.OC,
  [GeographicalAreaProto.Continent.SA]: Continent.SA,
}

async function processNodeLocationMetadata(
  event: SubstrateEvent,
  store: DatabaseManager,
  current: NodeLocationMetadata | undefined,
  meta: INodeLocationMetadata
): Promise<NodeLocationMetadata> {
  const nodeLocation = current || new NodeLocationMetadata({ id: deterministicEntityId(event) })
  if (isSet(meta.city)) {
    nodeLocation.city = meta.city
  }
  if (isSet(meta.coordinates)) {
    if (isEmptyObject(meta.coordinates)) {
      nodeLocation.coordinates = null as any
    } else {
      const coordinates = current?.coordinates || new GeoCoordinates({ id: deterministicEntityId(event) })
      coordinates.latitude = meta.coordinates.latitude || coordinates.latitude || 0
      coordinates.longitude = meta.coordinates.longitude || coordinates.longitude || 0
      await store.save<GeoCoordinates>(coordinates)
      nodeLocation.coordinates = coordinates
    }
  }
  if (isSet(meta.countryCode)) {
    if (isValidCountryCode(meta.countryCode)) {
      nodeLocation.countryCode = meta.countryCode
    } else {
      console.warn(`Invalid country code: ${meta.countryCode}`)
      nodeLocation.countryCode = null as any
    }
  }
  await store.save<NodeLocationMetadata>(nodeLocation)
  return nodeLocation
}

export function processNodeOperationalStatusMetadata(
  actorContext: 'lead' | 'worker',
  current: typeof NodeOperationalStatus | undefined,
  meta: INodeOperationalStatusMetadata
): typeof NodeOperationalStatus {
  const isCurrentForced =
    current &&
    (current instanceof NodeOperationalStatusNoService ||
      current instanceof NodeOperationalStatusNoServiceFrom ||
      current instanceof NodeOperationalStatusNoServiceDuring) &&
    current.forced

  // if current state is forced by lead, then prevent worker from unilaterally reversing.
  if (isCurrentForced && actorContext === 'worker') {
    return current
  }

  // set node state to NoService
  if (meta.status === NodeOperationalStatusMetadata.OperationalStatus.NO_SERVICE) {
    if (meta.noServiceFrom && meta.noServiceTo) {
      const status = new NodeOperationalStatusNoServiceDuring()
      status.from = new Date(meta.noServiceFrom)
      status.to = new Date(meta.noServiceTo)
      status.rationale = meta.rationale || (null as any)
      status.forced = actorContext === 'lead'
      return status
    } else if (meta.noServiceFrom && !meta.noServiceTo) {
      const status = new NodeOperationalStatusNoServiceFrom()
      status.from = new Date(meta.noServiceFrom)
      status.rationale = meta.rationale || (null as any)
      status.forced = actorContext === 'lead'
      return status
    } else if (!meta.noServiceFrom && !meta.noServiceTo) {
      const status = new NodeOperationalStatusNoService()
      status.rationale = meta.rationale || (null as any)
      status.forced = actorContext === 'lead'
      return status
    }
  }

  // Default operational status of the node
  const status = new NodeOperationalStatusNormal()
  status.rationale = meta.rationale || (null as any)
  return status
}

export async function processDistributionOperatorMetadata(
  event: SubstrateEvent,
  store: DatabaseManager,
  current: DistributionBucketOperatorMetadata | undefined,
  metadataBytes: Bytes
): Promise<DistributionBucketOperatorMetadata | undefined> {
  const meta = deserializeMetadata(DistributionBucketOperatorMetadataProto, metadataBytes)
  if (!meta) {
    return current
  }
  const metadataEntity = current || new DistributionBucketOperatorMetadata({ id: deterministicEntityId(event) })
  if (isSet(meta.endpoint)) {
    metadataEntity.nodeEndpoint = meta.endpoint
  }
  if (isSet(meta.location)) {
    metadataEntity.nodeLocation = isEmptyObject(meta.location)
      ? (null as any)
      : await processNodeLocationMetadata(event, store, metadataEntity.nodeLocation, meta.location)
  }
  if (isSet(meta.extra)) {
    metadataEntity.extra = meta.extra
  }
  if (isSet(meta.operationalStatus)) {
    metadataEntity.nodeOperationalStatus = processNodeOperationalStatusMetadata(
      'worker',
      metadataEntity.nodeOperationalStatus,
      meta.operationalStatus
    )
  }

  await store.save<DistributionBucketOperatorMetadata>(metadataEntity)

  return metadataEntity
}

export async function processStorageOperatorMetadata(
  event: SubstrateEvent,
  store: DatabaseManager,
  current: StorageBucketOperatorMetadata | undefined,
  metadataBytes: Bytes
): Promise<StorageBucketOperatorMetadata | undefined> {
  const meta = deserializeMetadata(StorageBucketOperatorMetadataProto, metadataBytes)
  if (!meta) {
    return current
  }
  const metadataEntity = current || new StorageBucketOperatorMetadata({ id: deterministicEntityId(event) })
  if (isSet(meta.endpoint)) {
    metadataEntity.nodeEndpoint = meta.endpoint || (null as any)
  }
  if (isSet(meta.location)) {
    metadataEntity.nodeLocation = isEmptyObject(meta.location)
      ? (null as any)
      : await processNodeLocationMetadata(event, store, metadataEntity.nodeLocation, meta.location)
  }
  if (isSet(meta.extra)) {
    metadataEntity.extra = meta.extra || (null as any)
  }
  if (isSet(meta.operationalStatus)) {
    metadataEntity.nodeOperationalStatus = processNodeOperationalStatusMetadata(
      'worker',
      metadataEntity.nodeOperationalStatus,
      meta.operationalStatus
    )
  }

  await store.save<StorageBucketOperatorMetadata>(metadataEntity)

  return metadataEntity
}

export async function processDistributionBucketFamilyMetadata(
  event: SubstrateEvent,
  store: DatabaseManager,
  current: DistributionBucketFamilyMetadata | undefined,
  metadataBytes: Bytes
): Promise<DistributionBucketFamilyMetadata | undefined> {
  const meta = deserializeMetadata(DistributionBucketFamilyMetadataProto, metadataBytes)
  if (!meta) {
    return current
  }
  const metadataEntity = current || new DistributionBucketFamilyMetadata({ id: deterministicEntityId(event) })
  if (isSet(meta.region)) {
    metadataEntity.region = meta.region || (null as any)
  }
  if (isSet(meta.description)) {
    metadataEntity.description = meta.description || (null as any)
  }
  if (isSet(meta.latencyTestTargets)) {
    metadataEntity.latencyTestTargets = meta.latencyTestTargets.filter((t) => t)
  }

  await store.save<DistributionBucketFamilyMetadata>(metadataEntity)

  // Update areas after metadata is saved (since we need an id to reference)
  if (isSet(meta.areas)) {
    // Drop current areas
    await Promise.all(metadataEntity.areas?.map((a) => store.remove<DistributionBucketFamilyGeographicArea>(a)) || [])
    // Save new areas
    await Promise.all(
      _.uniqWith(
        meta.areas.filter((a) => !isEmptyObject(a)),
        _.isEqual
      ).map(async (a, i) => {
        const area = new DistributionBucketFamilyGeographicArea({
          id: `${metadataEntity.id}-${i}`,
          distributionBucketFamilyMetadata: metadataEntity,
        })

        if (a.continent) {
          const continent = new GeographicalAreaContinent()
          continent.code = protobufContinentToGraphlContinent[a.continent]
          if (!continent.code) {
            return invalidMetadata(`Unrecognized continent enum variant: ${a.continent}`)
          }
          area.area = continent
        } else if (a.countryCode) {
          if (!isValidCountryCode(a.countryCode)) {
            return invalidMetadata(`Invalid country code: ${a.countryCode}`)
          }
          const country = new GeographicalAreaCountry()
          country.code = a.countryCode
          area.area = country
        } else if (a.subdivisionCode) {
          if (!isValidSubdivisionCode(a.subdivisionCode)) {
            return invalidMetadata(`Invalid subdivision code: ${a.subdivisionCode}`)
          }
          const subdivision = new GeographicalAreaSubdivistion()
          subdivision.code = a.subdivisionCode
          area.area = subdivision
        } else {
          return
        }

        await store.save<DistributionBucketFamilyGeographicArea>(area)
      })
    )
  }

  return metadataEntity
}
