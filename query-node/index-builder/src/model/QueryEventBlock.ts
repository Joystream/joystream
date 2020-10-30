//import { BlockNumber } from '@polkadot/types/interfaces';
import { IQueryEvent } from './';

export class QueryEventBlock {
  readonly block_number: number;

  readonly query_events: IQueryEvent[];

  constructor(block_number: number, query_events: IQueryEvent[]) {
    this.block_number = block_number;
    this.query_events = query_events;
  }
}
