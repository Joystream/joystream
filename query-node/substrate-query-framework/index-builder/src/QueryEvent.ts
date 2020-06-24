import { EventRecord, Extrinsic } from '@polkadot/types/interfaces';
import { Codec } from '@polkadot/types/types';
import * as BN from 'bn.js';

interface EventParameters {
  [key: string]: Codec;
}

export interface SubstrateEvent {
  event_name: string;
  event_method: string;
  event_params: EventParameters;
  index: BN;
  block_number: BN;
  extrinsic?: Extrinsic;
}

export default class QueryEvent implements SubstrateEvent {
  readonly event_record: EventRecord;

  readonly block_number: BN;

  readonly extrinsic?: Extrinsic;

  constructor(event_record: EventRecord, block_number: BN, extrinsic?: Extrinsic) {
    this.event_record = event_record;
    this.extrinsic = extrinsic;
    this.block_number = block_number;
  }

  get event_name(): string {
    let event = this.event_record.event;

    return event.section + '.' + event.method;
  }

  get event_method(): string {
    return this.event_record.event.method;
  }

  get event_params(): EventParameters {
    const { event } = this.event_record;

    let params: EventParameters = {};

    event.data.forEach((data, index) => {
      params[event.typeDef[index].type] = data;
    });
    return params;
  }

  // Get event index as number
  get index(): BN {
    return new BN(this.event_record.event.index);
  }

  log(indent: number, logger: (str: string) => void): void {
    // Extract the phase, event
    const { event, phase } = this.event_record;

    logger(`\t\t\tParameters:`);
    event.data.forEach((data, index) => {
      logger(`\t\t\t\t${event.typeDef[index]}: ${data.toString()}`);
    });

    logger(
      `\t\t\tExtrinsic: ${
        this.extrinsic ? this.extrinsic.method.sectionName + '.' + this.extrinsic.method.methodName : 'NONE'
      }`
    );
    logger(`\t\t\t\tPhase: ${phase.toString()}`);

    if (this.extrinsic) {
      logger(`\t\t\t\tParameters:`);
      this.extrinsic.args.forEach((arg, index) => {
        logger(`\t\t\t\t\t${arg.toRawType()}: ${arg.toString()}`);
      });
    }
  }
}
