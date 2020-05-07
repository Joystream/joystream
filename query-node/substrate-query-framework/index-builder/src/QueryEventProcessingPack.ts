// @ts-check

import { DB } from '.';

export type QueryEventProcessorResult = void | Promise<void>;

export default interface QueryEventProcessingPack {
  [index: string]: (db: DB) => QueryEventProcessorResult;
}
