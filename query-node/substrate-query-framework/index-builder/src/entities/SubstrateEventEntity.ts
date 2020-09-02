import { Entity, Column, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import { AnyJson } from '../interfaces/json-types';
import { JsonTransformer } from '@anchan828/typeorm-transformers';
import { QueryEvent } from '..';
import * as BN from 'bn.js';
import Debug from 'debug';
import { SubstrateExtrinsicEntity } from './SubstrateExtrinsicEntity';

const debug = Debug('index-builder:QueryEventEntity');

export const EVENT_TABLE_NAME = 'substrate_event'

export interface EventParam {
  type: string;
  name: string;
  value: AnyJson;
}


@Entity({
  name: EVENT_TABLE_NAME
})
export class SubstrateEventEntity {
  @PrimaryColumn()
  id!: string;   

  @Column()
  name!: string;

  @Column({
    nullable: true
  })
  section?: string;

  @Column()
  method!: string;

  @Column({
    type: 'jsonb',
    transformer: new JsonTransformer<AnyJson>()
  })
  phase!: AnyJson;

  @Column()
  blockNumber!: number;

  @Column()
  index!: number;

  @Column({
    type: 'jsonb',
    transformer: new JsonTransformer<EventParam[]>([]),
  })
  params!: EventParam[];

 
  @OneToOne(() => SubstrateExtrinsicEntity, (e: SubstrateExtrinsicEntity) => e.event, {
    cascade: true,
    nullable: true,
  })
  @JoinColumn()
  extrinsic?: SubstrateExtrinsicEntity;

  static fromQueryEvent(q: QueryEvent): SubstrateEventEntity {
    const _entity =  new SubstrateEventEntity();
    
    _entity.blockNumber = q.block_number;
    _entity.index = q.indexInBlock;
    _entity.id = SubstrateEventEntity.formatId(_entity);
    _entity.method = q.event_record.event.method || 'NO_METHOD';
    _entity.name = q.event_name;
    _entity.phase = q.event_record.phase.toJSON();
    _entity.section = q.event_record.event.section || 'NO_SECTION';
    
    _entity.params = [];

    const { event } = q.event_record;

    if (event.data.length) {
      q.event_record.event.data.forEach((data, index) => {
        _entity.params.push({
          type: event.typeDef[index].type,
          name: event.typeDef[index].name || '',
          value: data.toJSON(),
        } as EventParam)
      });
    }

    if (q.extrinsic) {
      const e = q.extrinsic;
      const extr = new SubstrateExtrinsicEntity();
      _entity.extrinsic = extr;
      
      extr.blockNumber = q.block_number;
      extr.signature = e.signature.toString();
      extr.signer = e.signer.toString();
      extr.method = e.method.methodName || 'NO_METHOD';
      extr.section = e.method.sectionName || 'NO_SECTION';
      extr.meta = e.meta.toJSON();
      extr.hash = e.hash.toString();
      extr.isSigned = e.isSigned
      extr.tip = new BN(e.tip.toString()),
      extr.versionInfo = e.version.toString();
      extr.nonce = e.nonce.toNumber();
      extr.era = e.era.toJSON();
      
      extr.args = []
      
      e.method.args.forEach((data, index) => {
        extr.args.push({
          type: data.toRawType(),
          value: data.toJSON(),
          name: e.meta.args[index].name.toString()
        })
      })
    }
    debug(`Event entity: ${JSON.stringify(_entity, null, 2)}`);

    return _entity;
  }

  // return id in the format 000000..00<blockNum>-000<index> 
  // the reason for such formatting is to be able to efficiently sort events 
  // by ID
  public static formatId(e: SubstrateEventEntity): string {
    return `${String(e.blockNumber).padStart(16, '0')}-${String(e.index).padStart(5, '0')}`;
  }
}

