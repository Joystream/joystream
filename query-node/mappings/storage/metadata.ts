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
import { isSet } from '@joystream/metadata-protobuf/utils'

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
    const coordinates = current?.coordinates || new GeoCoordinates()
    coordinates.latitude = meta.coordinates.latitude
    coordinates.longitude = meta.coordinates.longitude
    await store.save<GeoCoordinates>(coordinates)
    nodeLocation.coordinates = coordinates
  }
  if (isSet(meta.countryCode)) {
    // TODO: Validate the code
    nodeLocation.countryCode = meta.countryCode
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
    metadataEntity.nodeLocation = await processNodeLocationMetadata(store, metadataEntity.nodeLocation, meta.location)
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
    metadataEntity.nodeEndpoint = meta.endpoint
  }
  if (isSet(meta.location)) {
    metadataEntity.nodeLocation = await processNodeLocationMetadata(store, metadataEntity.nodeLocation, meta.location)
  }
  if (isSet(meta.extra)) {
    metadataEntity.extra = meta.extra
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
    metadataEntity.region = meta.region
  }
  if (isSet(meta.description)) {
    metadataEntity.description = meta.description
  }

  await store.save<DistributionBucketOperatorMetadata>(metadataEntity)

  // Update boundary after metadata is saved (since we need an id to reference)
  if (isSet(meta.boundary)) {
    await Promise.all((metadataEntity.boundary || []).map((coords) => store.remove<GeoCoordinates>(coords)))
    await Promise.all(
      meta.boundary.map(({ latitude, longitude }) =>
        store.save<GeoCoordinates>(
          new GeoCoordinates({ latitude, longitude, boundarySourceBucketFamilyMeta: metadataEntity })
        )
      )
    )
  }

  return metadataEntity
}
