import { DatabaseManager } from '@joystream/hydra-common'
import { BaseModel } from '@joystream/warthog'
import { WorkingGroup } from '@joystream/types/augment/all'
import { AnyMetadataClass, DecodedMetadataObject } from '@joystream/metadata-protobuf/types'
import { metaToObject } from '@joystream/metadata-protobuf/utils'
import { Bytes } from '@polkadot/types'

type EntityClass<T extends BaseModel> = {
  new (): T
  name: string
}

type RelationsArr<T extends BaseModel> = Exclude<
  keyof T & string,
  { [K in keyof T]: T[K] extends BaseModel | undefined ? '' : T[K] extends BaseModel[] | undefined ? '' : K }[keyof T]
>[]

export async function getById<T extends BaseModel>(
  store: DatabaseManager,
  entityClass: EntityClass<T>,
  id: string,
  relations?: RelationsArr<T>
): Promise<T> {
  const result = await store.get(entityClass, { where: { id }, relations })
  if (!result) {
    throw new Error(`Expected ${entityClass.name} not found by ID: ${id}`)
  }

  return result
}

export type WorkingGroupModuleName = 'storageWorkingGroup' | 'contentDirectoryWorkingGroup'

export function getWorkingGroupModuleName(group: WorkingGroup): WorkingGroupModuleName {
  if (group.isContent) {
    return 'contentDirectoryWorkingGroup'
  } else if (group.isStorage) {
    return 'storageWorkingGroup'
  }

  throw new Error(`Unsupported working group encountered: ${group.type}`)
}

export function deserializeMetadata<T>(
  metadataType: AnyMetadataClass<T>,
  metadataBytes: Bytes
): DecodedMetadataObject<T> | null {
  try {
    return metaToObject(metadataType, metadataType.decode(metadataBytes.toU8a(true)))
  } catch (e) {
    console.error(`Cannot deserialize ${metadataType.name}! Provided bytes: (${metadataBytes.toHex()})`)
    return null
  }
}

export function bytesToString(b: Bytes): string {
  return (
    Buffer.from(b.toU8a(true))
      .toString()
      // eslint-disable-next-line no-control-regex
      .replace(/\u0000/g, '')
  )
}
