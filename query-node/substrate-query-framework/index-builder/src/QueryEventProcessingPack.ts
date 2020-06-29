// @ts-check

import { DatabaseManager, SubstrateEvent } from '.';

export type QueryEventProcessorResult = void | Promise<void>;

export default interface QueryEventProcessingPack {
  [index: string]: (db: DatabaseManager, event: SubstrateEvent) => QueryEventProcessorResult;
}
