// @ts-check

import QueryEvent from './QueryEvent'

export type QueryEventProcessorResult = void | Promise<void>

export default interface QueryEventProcessingPack {
    [index: string] : (query_event: QueryEvent) => QueryEventProcessorResult
}