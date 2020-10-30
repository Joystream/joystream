import { QueryEventBlock, IQueryEvent } from "../../src";
import { Phase, Event, EventRecord } from '@polkadot/types/interfaces';
import { BlockPayload } from "../../src/model";
import { withTs } from "../../src/utils/stringify";

export function blockPayload(height: number): BlockPayload {
  return withTs({
    height
  }) as unknown as BlockPayload
}

export function queryEventBlock(block = 0): QueryEventBlock {
  const gen = queryEvent(block);
  return {
    block_number: block,
    query_events: [gen.next().value as IQueryEvent, 
      gen.next().value as IQueryEvent, 
      gen.next().value as IQueryEvent]
  }
}

export function * queryEvent(block = 0): Generator<IQueryEvent, void, IQueryEvent> {
  // TODO: use faker
  let i = 0;
  do {  
    yield {
          eventRecord: {
            phase: {
              toJSON: () => { return {} }
            } as unknown as Phase,
            event: {
              method: 'fake.method',
              section: 'fake.section',
              data: []
            } as unknown as Event
          } as unknown as EventRecord,
          blockNumber: block,
          indexInBlock: i,
          eventName: 'fake.event',
          eventMethod: 'fake.method',
          eventParams: {},
          index: i
    }
    i++;
  } while (i < 100)
}