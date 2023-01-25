import { AnyMetadataClass, DecodedMetadataObject } from '@joystream/metadata-protobuf/types'
import { Bytes } from '@polkadot/types/primitive'
import { metaToObject } from '@joystream/metadata-protobuf/utils'
import { createType } from '@joystream/types'
import { Option } from '@polkadot/types'
import { PalletContentStorageAssetsRecord } from '@polkadot/types/lookup'

export function metadataToBytes<T>(metaClass: AnyMetadataClass<T>, obj: T): Bytes {
  return createType('Bytes', '0x' + Buffer.from(metaClass.encode(obj).finish()).toString('hex'))
}

export function metadataFromBytes<T>(metaClass: AnyMetadataClass<T>, bytes: Bytes): DecodedMetadataObject<T> {
  return metaToObject(metaClass, metaClass.decode(bytes.toU8a(true)))
}

export function asValidatedMetadata<T>(metaClass: AnyMetadataClass<T>, anyObject: any): T {
  const error = metaClass.verify(anyObject)
  if (error) {
    throw new Error(`Invalid metadata: ${error}`)
  }
  return { ...anyObject } as T
}

export function generateAppActionCommitment(
  creatorId: string,
  assets: Option<PalletContentStorageAssetsRecord>,
  rawAction: Bytes,
  rawAppMetadata: Bytes
): string {
  return JSON.stringify([creatorId, assets.toString(), rawAction, rawAppMetadata])
}
