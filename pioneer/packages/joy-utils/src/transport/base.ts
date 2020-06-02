import { ApiPromise } from "@polkadot/api";
import { Observable } from 'rxjs';
import { StorageEntryBase } from '@polkadot/api/types';
import { CodecArg, Codec } from '@polkadot/types/types';

type ApiMethod = StorageEntryBase<"promise", (arg1?: CodecArg, arg2?: CodecArg) => Observable<Codec>>;

export default abstract class BaseTransport {
  protected api: ApiPromise;

  constructor(api: ApiPromise) {
    this.api = api;
  }

  protected get proposalsEngine() {
    return this.api.query.proposalsEngine;
  }

  protected get proposalsCodex() {
    return this.api.query.proposalsCodex;
  }

  protected get proposalsDiscussion() {
    return this.api.query.proposalsDiscussion;
  }

  protected get members() {
    return this.api.query.members;
  }

  protected get council() {
    return this.api.query.council;
  }

  protected get councilElection() {
    return this.api.query.councilElection;
  }

  protected get actors() {
    return this.api.query.actors;
  }

  protected get contentWorkingGroup() {
    return this.api.query.contentWorkingGroup;
  }

  protected get minting() {
    return this.api.query.minting;
  }

  // Fetch all double map entries using only the first key
  //
  // TODO: FIXME: This may be a risky implementation, because it relies on a few assumptions about how the data is stored etc.
  // With the current runtime version we can rely on the fact that all storage keys for double-map values start with the same
  // 32-bytes prefix assuming a given (fixed) value of the first key (ie. for all values like map[x][y], the storage key starts
  // with the same prefix as long as x remains the same. Changing y will not affect this prefix)
  protected async doubleMapEntries<T extends Codec> (
    method: ApiMethod,
    firstKey: Codec,
    valueConverter: (hex: string) => T
  ): Promise<{ storageKey: string, value: T}[]> {
    const entryKey = method.key(firstKey, 0);
    const entryKeyPrefix = entryKey.toString().substr(0, 66); // "0x" + 64 hex characters (32 bytes)
    const allEntryKeys = await this.api.rpc.state.getKeys(entryKeyPrefix);
    let entries: { storageKey: string, value: T }[] = [];
    for (let key of allEntryKeys) {
      const value: any = await this.api.rpc.state.getStorage(key);
      if (typeof value === 'object' && value !== null && value.raw) {
        entries.push({
          storageKey: key.toString(),
          value: valueConverter(value.raw.toString())
        })
      }
    }

    return entries;
  }
}
