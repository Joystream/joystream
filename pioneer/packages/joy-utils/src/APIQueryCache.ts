import { Codec } from '@polkadot/types/types';
import ApiPromise from '@polkadot/api/promise';

type cacheQueryStorage = {
  (...args: any): Promise<Codec>;
}

type cacheQueryModule = {
  [index: string]: cacheQueryStorage;
}

type cacheQueryRuntime = {
  [index: string]: cacheQueryModule;
}

export class APIQueryCache {
  protected api: ApiPromise
  protected cache: Map<string, Codec>
  protected unsubscribeFn: () => void = () => { /* do nothing */ }
  protected cacheHits = 0
  public query: cacheQueryRuntime = {}

  constructor (api: ApiPromise) {
    this.api = api;
    this.buildQuery();
    this.cache = new Map<string, Codec>();
    this.breakCacheOnNewBlocks();
  }

  unsubscribe () {
    this.unsubscribeFn();
  }

  protected async breakCacheOnNewBlocks () {
    this.unsubscribeFn = await this.api.rpc.chain.subscribeNewHeads((header) => {
      this.cache = new Map<string, Codec>();
      // console.log("cache hits in this block", this.cacheHits)
      this.cacheHits = 0;
    });
  }

  protected buildQuery () {
    const modules = Object.keys(this.api.query).map(key => ({ name: key, storage: this.api.query[key] }));
    modules.map((module) => {
      this.query[module.name] = {};

      const funcs = Object.keys(module.storage).map(key => ({ name: key, storage: module.storage[key] }));
      funcs.map((func) => {
        this.query[module.name][func.name] = async (...args: any): Promise<Codec> => {
          const cacheKey = module.name + func.name + JSON.stringify(args);
          const cacheValue = this.cache.get(cacheKey);
          if (cacheValue) {
            this.cacheHits++;
            return cacheValue;
          }

          const toCache = await this.api.query[module.name][func.name](...args);
          this.cache.set(cacheKey, toCache);
          return toCache;
        };
      });
    });
  }
}
