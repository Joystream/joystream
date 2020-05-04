import { EventRecord, Extrinsic, EventId } from '@polkadot/types/interfaces';

interface EventParameters {
  [key: string]: string;
}

export default class QueryEvent {
  readonly event_record: EventRecord;

  readonly block_number: number;

  readonly extrinsic?: Extrinsic;

  constructor(event_record: EventRecord, block_number: number, extrinsic?: Extrinsic) {
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
      params[event.typeDef[index].type] = data.toString();
    });
    return params;
  }

  // Get event index as number
  get index(): number {
    // Uint8Array
    const event_index = this.event_record.event.index;

    // Convert to number
    let buffer = Buffer.from(event_index);
    return buffer.readUIntBE(0, event_index.length);
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
