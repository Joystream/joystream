import { AnyMetadataClass, DecodedMetadataObject } from '@joystream/metadata-protobuf/types'
import { Bytes } from '@polkadot/types/primitive'
import { metaToObject } from '@joystream/metadata-protobuf/utils'
import { createType } from '@joystream/types'
import { u8aToHex, stringToHex } from '@polkadot/util'

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

// Return hex commitment for any app action
export function generateAppActionCommitment(
  nonce: number,
  creatorId: string,
  assets: Uint8Array,
  rawAction?: Bytes,
  rawAppActionMetadata?: Bytes
): string {
  const rawCommitment = [
    nonce,
    creatorId,
    u8aToHex(assets),
    ...(rawAction ? [u8aToHex(rawAction)] : []),
    ...(rawAppActionMetadata ? [u8aToHex(rawAppActionMetadata)] : []),
  ]
  return stringToHex(JSON.stringify(rawCommitment))
}
