import { Entity, Column, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import { AnyJson } from '../type-helpers';
import { JsonTransformer } from '@anchan828/typeorm-transformers';
import { QueryEvent } from '..';
import * as BN from 'bn.js';

import Debug from 'debug';
import { ChainExtrinsic } from './ChainExtrinsic';
const debug = Debug('index-builder:QueryEventEntity');

export interface ExtrinsicArg {
  type: string;
  value: AnyJson;
}

export interface EventParam {
  type: string;
  name: string;
  value: AnyJson;
}

export interface ExtrinsicJson {
  methodName: string;
  section: string;
  meta: AnyJson;
  signer: string;
  args: ExtrinsicArg[];
  signature: string;
  hash: string;
  tip: string;
  argsNo: number;
}

@Entity()
export class QueryEventEntity {
  @PrimaryColumn()
  id!: string;   

  @Column()
  name!: string;

  @Column({
    nullable: true
  })
  section?: string;

  @Column({
    nullable: true
  })
  method?: string;

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

 
  @OneToOne(type => ChainExtrinsic, {
    cascade: true,
    nullable: true
  })
  @JoinColumn()
  extrinsic?: ChainExtrinsic;

  static fromQueryEvent(q: QueryEvent): QueryEventEntity {
    const _entity =  new QueryEventEntity();
    
    _entity.blockNumber = q.block_number.toNumber();
    _entity.index = q.indexInBlock;
    _entity.id = `${q.block_number.toString()}-${q.indexInBlock.toString()}`;
    _entity.method = q.event_record.event.method;
    _entity.name = q.event_name;
    _entity.phase = q.event_record.phase.toJSON();
    _entity.section = q.event_record.event.section;
    
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
      const extr = new ChainExtrinsic();
      _entity.extrinsic = extr;
      
      new ChainExtrinsic();
      
      extr.blockNumber = q.block_number.toNumber();
      extr.signature = e.signature.toString();
      extr.signer = e.signer.toString();
      extr.method = e.method.methodName;
      extr.section = e.method.sectionName;
      extr.meta = e.meta.toJSON();
      extr.hash = e.hash.toString();
      extr.isSigned = e.isSigned
      extr.tip = new BN(e.tip.toString()),
      extr.versionInfo = e.version.toString();
      extr.nonce = e.nonce.toNumber();
      extr.era = e.era.toJSON();
      
      extr.params = []
      
      e.method.args.forEach((data, index) => {
        extr.params.push({
          type: data.toRawType(),
          value: data.toJSON(),
          name: e.meta.args[index].name.toString()
        })
      })
    }
    debug(`Event entity: ${JSON.stringify(_entity, null, 2)}`);

    return _entity;
  }
}

