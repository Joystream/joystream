import { EventRecord, Extrinsic } from '@polkadot/types/interfaces';

interface EventParameters {
    [key: string]: any
}

interface ExtrinsicArgument {
    type: string,
    value: any
}

export interface QueryEventDTO {
    parameters: EventParameters,
    extrinsic: string,
    extrinsic_args: ExtrinsicArgument[],
    phase: string,
    data: any,
    topics: string[]
}

export default class QueryEvent {
    readonly event_record: EventRecord;

    readonly extrinsic?: Extrinsic;

    constructor(event_record: EventRecord, extrinsic?: Extrinsic) {
        this.event_record = event_record;
        this.extrinsic = extrinsic;
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
            params[event.typeDef[index].type] = data.toJSON()
        });
        return params;
    }

    public toDTO():QueryEventDTO {
        const { event, phase } = this.event_record;
        let extrinsic = this.extrinsic 
            ? this.extrinsic.method.sectionName + '.' + this.extrinsic.method.methodName
            : 'NONE';
        let extrinsic_args: ExtrinsicArgument[]  = [];
        if (this.extrinsic) {
            extrinsic_args = this.extrinsic.args.map((a) => {
                return {
                    type: a.toRawType(),
                    value: a.toJSON()
                }
            });
        }
        let topics = this.event_record.topics.map((h) => h.toString());

        return {
            parameters: this.event_params,
            phase: phase.toString(),
            extrinsic,
            data: `${event.data.section}.${event.data.method}`,
            extrinsic_args,
            topics
        }
    }

    log(indent: number, logger: (str: string) => void): void {
        // Extract the phase, event
        const { event, phase } = this.event_record;

        logger(`\t\t\tParameters:`);
        event.data.forEach((data, index) => {
            logger(`\t\t\t\t${event.typeDef[index].type}: ${data.toString()}`);
        });

        logger(
            `\t\t\tExtrinsic: ${
            this.extrinsic
                ? this.extrinsic.method.sectionName + '.' + this.extrinsic.method.methodName
                : 'NONE'
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