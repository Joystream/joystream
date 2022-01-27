import { ApiPromise } from '@polkadot/api';
import { UInt } from '@polkadot/types/codec';
import { Codec } from '@polkadot/types/types';
import { QueryableStorageEntry } from '@polkadot/api/types/storage';
import { APIQueryCache } from './APIQueryCache';

export async function entriesByIds<IDType extends UInt, ValueType extends Codec> (
  apiMethod: QueryableStorageEntry<'promise'>,
  firstKey?: unknown // First key in case of double maps
): Promise<[IDType, ValueType][]> {
  const storageEntries = firstKey ? await apiMethod.entries<ValueType>(firstKey) : await apiMethod.entries<ValueType>();
  const entries: [IDType, ValueType][] = storageEntries
    .map(([storageKey, value]) => ([
      // If double-map (first key is provided), we map entries by second key
      storageKey.args[firstKey !== undefined ? 1 : 0] as IDType,
      value
    ]));

  return entries.sort((a, b) => a[0].toNumber() - b[0].toNumber());
}

export async function ids<IDType extends UInt> (
  apiMethod: QueryableStorageEntry<'promise'>
): Promise<IDType[]> {
  const storageKeys = await apiMethod.keys();

  return storageKeys.map((key) => key.args[0] as IDType).sort((a, b) => a.toNumber() - b.toNumber());
}

export default class BaseTransport {
  protected api: ApiPromise;
  protected cacheApi: APIQueryCache;

  constructor (api: ApiPromise, cacheApi: APIQueryCache) {
    this.api = api;
    this.cacheApi = cacheApi;
  }

  protected get proposalsEngine () {
    return this.cacheApi.query.proposalsEngine;
  }

  protected get proposalsCodex () {
    return this.cacheApi.query.proposalsCodex;
  }

  protected get proposalsDiscussion () {
    return this.cacheApi.query.proposalsDiscussion;
  }

  protected get members () {
    return this.cacheApi.query.members;
  }

  protected get council () {
    return this.cacheApi.query.council;
  }

  protected get councilElection () {
    return this.cacheApi.query.councilElection;
  }

  protected get actors () {
    return this.cacheApi.query.actors;
  }

  protected get minting () {
    return this.cacheApi.query.minting;
  }

  protected get hiring () {
    return this.cacheApi.query.hiring;
  }

  protected get stake () {
    return this.cacheApi.query.stake;
  }

  protected get recurringRewards () {
    return this.cacheApi.query.recurringRewards;
  }

  protected queryMethodByName (name: string) {
    const [module, method] = name.split('.');

    return this.api.query[module][method];
  }

  protected entriesByIds = entriesByIds
  protected ids = ids
}
