// @ts-check

import { DatabaseManager, SubstrateEvent } from '.';

export type QueryEventProcessorResult = void | Promise<void>;
export type EventHandlerFunc = (db: DatabaseManager, event: SubstrateEvent) => QueryEventProcessorResult

export default interface QueryEventProcessingPack {
  [index: string]: EventHandlerFunc;
}
