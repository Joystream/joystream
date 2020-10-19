import { ApiPromise } from '@polkadot/api'
import { UInt } from '@polkadot/types/codec'
import { Codec, CodecArg, Observable } from '@polkadot/types/types'
import { AugmentedQuery } from '@polkadot/api/types/storage'
import { APIQueryCache } from './APIQueryCache'

export async function entriesByIds<IDType extends UInt, ValueType extends Codec>(
  apiMethod: AugmentedQuery<'promise', (key: IDType) => Observable<ValueType>>
): Promise<[IDType, ValueType][]> {
  const entries: [IDType, ValueType][] = (await apiMethod.entries()).map(([storageKey, value]) => [
    storageKey.args[0] as IDType,
    value,
  ])

  return entries.sort((a, b) => a[0].toNumber() - b[0].toNumber())
}

export async function doubleMapEntriesByIds<K1Type extends CodecArg, IDType extends UInt, ValueType extends Codec>(
  apiMethod: AugmentedQuery<'promise', (key1: K1Type, key2: IDType) => Observable<ValueType>>,
  key1: K1Type
): Promise<[IDType, ValueType][]> {
  const entries: [IDType, ValueType][] = (await apiMethod.entries(key1)).map(([storageKey, value]) => [
    // Ffirst key is provided - we map entries by second key
    storageKey.args[1] as IDType,
    value,
  ])

  return entries.sort((a, b) => a[0].toNumber() - b[0].toNumber())
}

export async function ids<IDType extends UInt, ValueType extends Codec>(
  apiMethod: AugmentedQuery<'promise', (key: UInt) => Observable<ValueType>>
): Promise<IDType[]> {
  const storageKeys = await apiMethod.keys()

  return storageKeys.map((key) => key.args[0] as IDType).sort((a, b) => a.toNumber() - b.toNumber())
}

export default class BaseTransport {
  protected api: ApiPromise
  protected cacheApi: APIQueryCache

  constructor(api: ApiPromise, cacheApi: APIQueryCache) {
    this.api = api
    this.cacheApi = cacheApi
  }

  protected get proposalsEngine() {
    return this.cacheApi.query.proposalsEngine
  }

  protected get proposalsCodex() {
    return this.cacheApi.query.proposalsCodex
  }

  protected get proposalsDiscussion() {
    return this.cacheApi.query.proposalsDiscussion
  }

  protected get members() {
    return this.cacheApi.query.members
  }

  protected get council() {
    return this.cacheApi.query.council
  }

  protected get councilElection() {
    return this.cacheApi.query.councilElection
  }

  protected get minting() {
    return this.cacheApi.query.minting
  }

  protected get hiring() {
    return this.cacheApi.query.hiring
  }

  protected get stake() {
    return this.cacheApi.query.stake
  }

  protected get recurringRewards() {
    return this.cacheApi.query.recurringRewards
  }

  protected entriesByIds = entriesByIds
  protected doubleMapEntiresByIds = doubleMapEntriesByIds
  protected ids = ids
}
