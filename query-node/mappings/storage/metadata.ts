import { DatabaseManager } from '@joystream/hydra-common'
import {
  DistributionBucketFamilyMetadata,
  DistributionBucketOperatorMetadata,
  StorageBucketOperatorMetadata,
  GeoCoordinates,
  NodeLocationMetadata,
  Continent,
  GeographicalAreaContinent,
  GeographicalAreaCountry,
  GeographicalAreaSubdivistion,
  DistributionBucketFamilyGeographicArea,
} from 'query-node/dist/model'
import { deserializeMetadata, invalidMetadata } from '../common'
import { Bytes } from '@polkadot/types'
import {
  DistributionBucketOperatorMetadata as DistributionBucketOperatorMetadataProto,
  StorageBucketOperatorMetadata as StorageBucketOperatorMetadataProto,
  DistributionBucketFamilyMetadata as DistributionBucketFamilyMetadataProto,
  INodeLocationMetadata,
  GeographicalArea as GeographicalAreaProto,
} from '@joystream/metadata-protobuf'
import { isSet, isEmptyObject, isValidCountryCode, isValidSubdivisionCode } from '@joystream/metadata-protobuf/utils'

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
  store: DatabaseManager,
  current: NodeLocationMetadata | undefined,
  meta: INodeLocationMetadata
): Promise<NodeLocationMetadata> {
  const nodeLocation = current || new NodeLocationMetadata()
  if (isSet(meta.city)) {
    nodeLocation.city = meta.city
  }
  if (isSet(meta.coordinates)) {
    if (isEmptyObject(meta.coordinates)) {
      nodeLocation.coordinates = null as any
    } else {
      const coordinates = current?.coordinates || new GeoCoordinates()
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

export async function processDistributionOperatorMetadata(
  store: DatabaseManager,
  current: DistributionBucketOperatorMetadata | undefined,
  metadataBytes: Bytes
): Promise<DistributionBucketOperatorMetadata | undefined> {
  const meta = deserializeMetadata(DistributionBucketOperatorMetadataProto, metadataBytes)
  if (!meta) {
    return current
  }
  const metadataEntity = current || new DistributionBucketOperatorMetadata()
  if (isSet(meta.endpoint)) {
    metadataEntity.nodeEndpoint = meta.endpoint
  }
  if (isSet(meta.location)) {
    metadataEntity.nodeLocation = isEmptyObject(meta.location)
      ? (null as any)
      : await processNodeLocationMetadata(store, metadataEntity.nodeLocation, meta.location)
  }
  if (isSet(meta.extra)) {
    metadataEntity.extra = meta.extra
  }

  await store.save<DistributionBucketOperatorMetadata>(metadataEntity)

  return metadataEntity
}

export async function processStorageOperatorMetadata(
  store: DatabaseManager,
  current: StorageBucketOperatorMetadata | undefined,
  metadataBytes: Bytes
): Promise<StorageBucketOperatorMetadata | undefined> {
  const meta = deserializeMetadata(StorageBucketOperatorMetadataProto, metadataBytes)
  if (!meta) {
    return current
  }
  const metadataEntity = current || new StorageBucketOperatorMetadata()
  if (isSet(meta.endpoint)) {
    metadataEntity.nodeEndpoint = meta.endpoint || (null as any)
  }
  if (isSet(meta.location)) {
    metadataEntity.nodeLocation = isEmptyObject(meta.location)
      ? (null as any)
      : await processNodeLocationMetadata(store, metadataEntity.nodeLocation, meta.location)
  }
  if (isSet(meta.extra)) {
    metadataEntity.extra = meta.extra || (null as any)
  }

  await store.save<StorageBucketOperatorMetadata>(metadataEntity)

  return metadataEntity
}

export async function processDistributionBucketFamilyMetadata(
  store: DatabaseManager,
  current: DistributionBucketFamilyMetadata | undefined,
  metadataBytes: Bytes
): Promise<DistributionBucketFamilyMetadata | undefined> {
  const meta = deserializeMetadata(DistributionBucketFamilyMetadataProto, metadataBytes)
  if (!meta) {
    return current
  }
  const metadataEntity = current || new DistributionBucketFamilyMetadata()
  if (isSet(meta.region)) {
    metadataEntity.region = meta.region || (null as any)
  }
  if (isSet(meta.description)) {
    metadataEntity.description = meta.description || (null as any)
  }
  if (isSet(meta.latencyTestTargets)) {
    metadataEntity.latencyTestTargets = meta.latencyTestTargets.filter((t) => t)
  }

  await store.save<DistributionBucketOperatorMetadata>(metadataEntity)

  // Update areas after metadata is saved (since we need an id to reference)
  if (isSet(meta.areas)) {
    // Drop current areas
    await Promise.all(metadataEntity.areas?.map((a) => store.remove<DistributionBucketFamilyGeographicArea>(a)) || [])
    // Save new areas
    await Promise.all(
      meta.areas
        .filter((a) => !isEmptyObject(a))
        .map(async (a) => {
          const area = new DistributionBucketFamilyGeographicArea({
            distributionBucketFamilyMetadata: metadataEntity,
          })

          if (a.continent) {
            const continent = new GeographicalAreaContinent()
            continent.code = protobufContinentToGraphlContinent[a.continent]
            if (!continent.code) {
              return invalidMetadata(`Unrecognized continent enum variant: ${a.continent}`)
            }
            area.id = `${metadataEntity.id}-C-${continent.code}`
            area.area = continent
          }

          if (a.countryCode) {
            if (!isValidCountryCode(a.countryCode)) {
              return invalidMetadata(`Invalid country code: ${a.countryCode}`)
            }
            const country = new GeographicalAreaCountry()
            country.code = a.countryCode
            area.id = `${metadataEntity.id}-c-${country.code}`
            area.area = country
          }

          if (a.subdivisionCode) {
            if (!isValidSubdivisionCode(a.subdivisionCode)) {
              return invalidMetadata(`Invalid subdivision code: ${a.subdivisionCode}`)
            }
            const subdivision = new GeographicalAreaSubdivistion()
            subdivision.code = a.subdivisionCode
            area.id = `${metadataEntity.id}-s-${subdivision.code}`
            area.area = subdivision
          }

          await store.save<DistributionBucketFamilyGeographicArea>(area)
        })
    )
  }

  return metadataEntity
}
