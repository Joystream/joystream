import {
  Hash,
  Header,
  BlockNumber,
  EventRecord,
  SignedBlock,
} from '@polkadot/types/interfaces'
import { Callback, Codec } from '@polkadot/types/types'
import { UnsubscribePromise } from '@polkadot/api/types'
import { ApiPromise } from '@polkadot/api'

import { SubstrateService } from './SubstrateService'

/**
 * @description ...
 */
export interface ISubstrateService {
  getFinalizedHead(): Promise<Hash>
  getHeader(hash?: Hash | Uint8Array | string): Promise<Header>
  subscribeNewHeads(v: Callback<Header>): UnsubscribePromise
  getBlockHash(
    blockNumber?: BlockNumber | Uint8Array | number | string
  ): Promise<Hash>
  getBlock(hash?: Hash | Uint8Array | string): Promise<SignedBlock>
  // Cut down from at: (hash: Hash | Uint8Array | string, ...args: Parameters<F>) => PromiseOrObs<ApiType, ObsInnerType<ReturnType<F>>>;
  eventsAt(hash: Hash | Uint8Array | string): Promise<EventRecord[] & Codec>
  //eventsRange()
  //events()
  stop(): Promise<void>
}

export function makeSubstrateService(api: ApiPromise): ISubstrateService {
  return new SubstrateService(api)
}
