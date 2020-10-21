import { Codec, AnyFunction } from '@polkadot/types/types'
import ApiPromise from '@polkadot/api/promise'
import { AugmentedQuery, QueryableStorage, ObsInnerType, AugmentedQueryDoubleMap } from '@polkadot/api/types'
import { ApiQueryModuleKey } from '../types/api'
import _ from 'lodash'

type CacheQueryRuntime = {
  [Module in keyof QueryableStorage<'promise'>]: {
    [Method in keyof QueryableStorage<'promise'>[Module]]: QueryableStorage<'promise'>[Module][Method] extends
      | AugmentedQuery<'promise', infer F>
      | AugmentedQueryDoubleMap<'promise', infer F>
      ? (...args: Parameters<F>) => Promise<ObsInnerType<ReturnType<F>>>
      : never
  }
}

export class APIQueryCache {
  protected api: ApiPromise
  protected cache: Map<string, Codec>
  protected unsubscribeFn: () => void = () => {
    /* do nothing */
  }

  protected cacheHits = 0
  public query: CacheQueryRuntime

  constructor(api: ApiPromise) {
    this.api = api
    this.query = this.buildQuery()
    this.cache = new Map<string, Codec>()
    this.breakCacheOnNewBlocks()
      .then((unsub) => {
        this.unsubscribeFn = unsub
      })
      .catch((e) => {
        throw e
      })
  }

  unsubscribe() {
    this.unsubscribeFn()
  }

  protected breakCacheOnNewBlocks() {
    return this.api.rpc.chain.subscribeNewHeads(() => {
      this.cache = new Map<string, Codec>()
      // console.log("cache hits in this block", this.cacheHits)
      this.cacheHits = 0
    })
  }

  protected buildQuery() {
    // Simplified version of CacheQueryRuntime for TS-compatibility purposes
    const query: Record<string, Record<string, AnyFunction>> = {}

    const modules = Object.keys(this.api.query) as ApiQueryModuleKey[]

    for (const moduleKey of modules) {
      query[moduleKey] = _.mapValues(
        this.api.query[moduleKey],
        (method, methodKey): AnyFunction => async (...args: any[]) => {
          const cacheKey = moduleKey + methodKey + JSON.stringify(args)
          const cacheValue = this.cache.get(cacheKey)

          if (cacheValue) {
            this.cacheHits++

            return cacheValue
          }

          const toCache = (await (method as AnyFunction)(...args)) as Codec

          this.cache.set(cacheKey, toCache)

          return toCache
        }
      )
    }

    return query as CacheQueryRuntime
  }
}
