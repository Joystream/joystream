// @ts-check

import { DatabaseManager } from '../db';
import { SubstrateEvent } from '.';

export type QueryEventProcessorResult = void | Promise<void>;
export type EventHandlerFunc = (db: DatabaseManager, event: SubstrateEvent) => QueryEventProcessorResult

export interface QueryEventProcessingPack {
  [index: string]: EventHandlerFunc;
}
