import { EventRecord, Extrinsic } from '@polkadot/types/interfaces';
import { EventParameters } from './interfaces';


export default class QueryEvent {
  readonly event_record: EventRecord;

  readonly block_number: number;

  readonly extrinsic?: Extrinsic;

  readonly indexInBlock: number;

  constructor(event_record: EventRecord, block_number: number, indexInBlock: number, extrinsic?: Extrinsic) {
    this.event_record = event_record;
    this.extrinsic = extrinsic;
    this.block_number = block_number;
    this.indexInBlock = indexInBlock;
  }

  get event_name(): string {
    const event = this.event_record.event;

    return event.section + '.' + event.method;
  }

  get event_method(): string {
    return this.event_record.event.method;
  }

  get event_params(): EventParameters {
    const { event } = this.event_record;
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
    const { event, phase } = this.event_record;

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
