//import { BlockNumber } from '@polkadot/types/interfaces';
//import QueryEvent from './QueryEvent';
import * as BN from 'bn.js';
import { SubstrateEvent } from '.';

export default class QueryEventBlock {
  readonly block_number: BN;

  readonly query_events: SubstrateEvent[];

  constructor(block_number: BN, query_events: SubstrateEvent[]) {
    this.block_number = block_number;
    this.query_events = query_events;
  }
}
