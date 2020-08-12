import { Hash, Header, BlockNumber, EventRecord, SignedBlock } from '@polkadot/types/interfaces';
import { Callback, Codec } from '@polkadot/types/types';
import { u32 } from '@polkadot/types/primitive';
import { ApiPromise } from '@polkadot/api';
import { getSpecTypes } from '@polkadot/types-known';

import { ISubstrateQueryService } from '.';
import { UnsubscribePromise } from '@polkadot/api/types';

export class QueryService implements ISubstrateQueryService {
  // Enough large number
  private readonly _versionReset = 99999999;

  private _api: ApiPromise;

  // Store runtime spec version
  private _specVersion: u32;

  constructor(api: ApiPromise) {
    this._api = api;
    this._specVersion = api.createType('u32', this._versionReset);
  }

  /**
   * Update api metadata to the latest
   */
  async resetMeta(): Promise<ApiPromise> {
    return await this.ensureMeta(await this.getFinalizedHead());
  }

  /**
   * Makes sure the api has correct types and metadata before fetching the block data
   * @param blockHash Hash | Uint8Array | string
   */
  async ensureMeta(blockHash: Hash | Uint8Array | string): Promise<ApiPromise> {
    const api = this._api;

    try {
      const version = await api.rpc.state.getRuntimeVersion(blockHash);
      const blockSpecVersion = version.specVersion;

      // Register types for the block and update metadata if spec version is diffrent
      if (!this._specVersion.eq(blockSpecVersion)) {
        this._specVersion = blockSpecVersion;

        const meta = await api.rpc.state.getMetadata(blockHash);
        const chain = await api.rpc.system.chain();

        api.registerTypes(getSpecTypes(api.registry, chain, version.specName, blockSpecVersion));
        api.registry.setMetadata(meta);
      }
    } catch (error) {
      console.error(`Failed to get Metadata for block ${JSON.stringify(blockHash, null, 2)}, using latest.`);
      console.error(error);
      this._specVersion = api.createType('u32', this._versionReset);
    }

    return api;
  }

  async getHeader(hash: Hash | Uint8Array | string): Promise<Header> {
    const api = await this.ensureMeta(hash);
    return api.rpc.chain.getHeader(hash);
  }

  getFinalizedHead(): Promise<Hash> {
    return this._api.rpc.chain.getFinalizedHead();
  }

  subscribeNewHeads(v: Callback<Header>): UnsubscribePromise {
    return this._api.rpc.chain.subscribeNewHeads(v);
  }

  getBlockHash(blockNumber?: BlockNumber | Uint8Array | number | string): Promise<Hash> {
    return this._api.rpc.chain.getBlockHash(blockNumber);
  }

  async getBlock(hash: Hash | Uint8Array | string): Promise<SignedBlock> {
    const api = await this.ensureMeta(hash);
    return api.rpc.chain.getBlock(hash);
  }

  async eventsAt(hash: Hash | Uint8Array | string): Promise<EventRecord[] & Codec> {
    const api = await this.ensureMeta(hash);
    return api.query.system.events.at(hash);
  }
}
