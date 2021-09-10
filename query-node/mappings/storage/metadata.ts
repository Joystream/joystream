import { DatabaseManager } from '@joystream/hydra-common'
import {
  DistributionBucketFamilyMetadata,
  DistributionBucketOperatorMetadata,
  StorageBucketOperatorMetadata,
  GeoCoordinates,
  NodeLocationMetadata,
} from 'query-node/dist/model'
import { deserializeMetadata } from '../common'
import { Bytes } from '@polkadot/types'
import {
  DistributionBucketOperatorMetadata as DistributionBucketOperatorMetadataProto,
  StorageBucketOperatorMetadata as StorageBucketOperatorMetadataProto,
  DistributionBucketFamilyMetadata as DistributionBucketFamilyMetadataProto,
  INodeLocationMetadata,
} from '@joystream/metadata-protobuf'
import { isSet, isEmptyObject, isValidCountryCode } from '@joystream/metadata-protobuf/utils'

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

  await store.save<DistributionBucketOperatorMetadata>(metadataEntity)

  // Update boundary after metadata is saved (since we need an id to reference)
  if (isSet(meta.boundary)) {
    await Promise.all((metadataEntity.boundary || []).map((coords) => store.remove<GeoCoordinates>(coords)))
    await Promise.all(
      meta.boundary
        .filter((c) => !isEmptyObject(c))
        .map(({ latitude, longitude }) =>
          store.save<GeoCoordinates>(
            new GeoCoordinates({
              latitude: latitude || 0,
              longitude: longitude || 0,
              boundarySourceBucketFamilyMeta: metadataEntity,
            })
          )
        )
    )
  }

  return metadataEntity
}
