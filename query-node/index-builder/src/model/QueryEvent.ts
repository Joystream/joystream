import { EventRecord, Extrinsic } from '@polkadot/types/interfaces';
import { Codec } from '@polkadot/types/types';

export interface IQueryEvent {
  eventRecord: EventRecord;
  blockNumber: number;
  indexInBlock: number;
  eventName: string;
  eventMethod: string;
  eventParams: EventParameters;
  extrinsic?: Extrinsic;
  index: number
}

export interface EventParameters {
  // TODO how do we reprsent it?
  [key: string]: Codec;
}

export class QueryEvent implements IQueryEvent {
  readonly eventRecord: EventRecord;

  readonly blockNumber: number;

  readonly extrinsic?: Extrinsic;

  readonly indexInBlock: number;

  constructor(event_record: EventRecord, block_number: number, indexInBlock: number, extrinsic?: Extrinsic) {
    this.eventRecord = event_record;
    this.extrinsic = extrinsic;
    this.blockNumber = block_number;
    this.indexInBlock = indexInBlock;
  }

  get eventName(): string {
    const event = this.eventRecord.event;

    return `${event.section}.${event.method}`;
  }

  get eventMethod(): string {
    return this.eventRecord.event.method;
  }

  get eventParams(): EventParameters {
    const { event } = this.eventRecord;
    const params: EventParameters = {};

    // Event data can be Null(polkadot type)
    if (!event.data.length) return params;

    event.data.forEach((data, index) => {
      params[event.typeDef[index].type] = data;
    });
    return params;
  }

  // Get event index as number
  get index(): number {
    return this.indexInBlock;
  }

  log(indent: number, logger: (str: string) => void): void {
    // Extract the phase, event
    const { event, phase } = this.eventRecord;

    // Event data can be Null(polkadot type)
    if (!event.data.length) return;

    logger(`\t\t\tParameters:`);
    event.data.forEach((data, index) => {
      logger(`\t\t\t\t${JSON.stringify(event.typeDef[index], null, 2)}: ${data.toString()}`);
    });

    logger(
      `\t\t\tExtrinsic: ${
        this.extrinsic ? this.extrinsic.method.sectionName + '.' + this.extrinsic.method.methodName : 'NONE'
      }`
    );
    logger(`\t\t\t\tPhase: ${phase.toString()}`);

    if (this.extrinsic) {
      logger(`\t\t\t\tParameters:`);
      this.extrinsic.args.forEach((arg) => {
        logger(`\t\t\t\t\t${arg.toRawType()}: ${arg.toString()}`);
      });
    }
  }
}

// return id in the format 000000..00<blockNum>-000<index> 
// the reason for such formatting is to be able to efficiently sort events 
// by ID
export function formatEventId(blockNumber: number, index: number): string {
  return `${String(blockNumber).padStart(16, '0')}-${String(index).padStart(6, '0')}`;
}