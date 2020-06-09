import { ApiPromise } from '@polkadot/api';
import { Codec } from '@polkadot/types/types';

export default abstract class BaseTransport {
  protected api: ApiPromise;

  constructor (api: ApiPromise) {
    this.api = api;
  }

  protected get proposalsEngine () {
    return this.api.query.proposalsEngine;
  }

  protected get proposalsCodex () {
    return this.api.query.proposalsCodex;
  }

  protected get proposalsDiscussion () {
    return this.api.query.proposalsDiscussion;
  }

  protected get members () {
    return this.api.query.members;
  }

  protected get council () {
    return this.api.query.council;
  }

  protected get councilElection () {
    return this.api.query.councilElection;
  }

  protected get actors () {
    return this.api.query.actors;
  }

  protected get contentWorkingGroup () {
    return this.api.query.contentWorkingGroup;
  }

  protected get minting () {
    return this.api.query.minting;
  }

  protected queryMethodByName (name: string) {
    const [module, method] = name.split('.');
    return this.api.query[module][method];
  }

  // Fetch all double map entries using only the first key
  //
  // TODO: FIXME: This may be a risky implementation, because it relies on a few assumptions about how the data is stored etc.
  // With the current runtime version we can rely on the fact that all storage keys for double-map values start with the same
  // 32-bytes prefix assuming a given (fixed) value of the first key (ie. for all values like map[x][y], the storage key starts
  // with the same prefix as long as x remains the same. Changing y will not affect this prefix)
  protected async doubleMapEntries<T extends Codec> (
    methodName: string,
    firstKey: Codec,
    valueConverter: (hex: string) => T,
    getEntriesCount: () => Promise<number>,
    secondKeyStart = 1
  ): Promise<{ secondKey: number; value: T}[]> {
    // Get prefix and storage keys of all entries
    const firstEntryStorageKey = this.queryMethodByName(methodName).key(firstKey, secondKeyStart);
    const entryStorageKeyPrefix = firstEntryStorageKey.substr(0, 66); // "0x" + 64 hex characters (32 bytes)
    const allEntriesStorageKeys = await this.api.rpc.state.getKeys(entryStorageKeyPrefix);

    // Create storageKey-to-secondKey map
    const maxSecondKey = (await getEntriesCount()) - 1 + secondKeyStart;
    const storageKeyToSecondKey: { [key: string]: number } = {};
    for (let secondKey = secondKeyStart; secondKey <= maxSecondKey; ++secondKey) {
      const storageKey = this.queryMethodByName(methodName).key(firstKey, secondKey);
      storageKeyToSecondKey[storageKey] = secondKey;
    }

    // Create the resulting entries array
    const entries: { secondKey: number; value: T }[] = [];
    for (const key of allEntriesStorageKeys) {
      const value: any = await this.api.rpc.state.getStorage(key);
      if (typeof value === 'object' && value !== null && value.raw) {
        entries.push({
          secondKey: storageKeyToSecondKey[key.toString()],
          value: valueConverter(value.raw.toString())
        });
      }
    }

    return entries;
  }
}
