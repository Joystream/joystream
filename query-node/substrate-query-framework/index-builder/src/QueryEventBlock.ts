//import { BlockNumber } from '@polkadot/types/interfaces';
import QueryEvent from './QueryEvent';
import * as BN from 'bn.js';

export default class QueryEventBlock {
  readonly block_number: BN;

  readonly query_events: QueryEvent[];

  constructor(block_number: BN, query_events: QueryEvent[]) {
    this.block_number = block_number;
    this.query_events = query_events;
  }
}
