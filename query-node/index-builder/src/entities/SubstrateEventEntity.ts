import {
  Entity,
  Column,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
  Index,
} from 'typeorm'
import { AnyJson, AnyJsonField } from '../interfaces/json-types'
import { formatEventId, IQueryEvent } from '..'
import * as BN from 'bn.js'
import { SubstrateExtrinsicEntity } from './SubstrateExtrinsicEntity'
import { EventParam } from '../model/substrate-interfaces'
import { AbstractWarthogModel } from './AbstractWarthogModel'

export const EVENT_TABLE_NAME = 'substrate_event'

@Entity({
  name: EVENT_TABLE_NAME,
})
@Index(['blockNumber', 'index'], { unique: true })
export class SubstrateEventEntity extends AbstractWarthogModel {
  @PrimaryColumn()
  id!: string

  @Column()
  @Index()
  name!: string

  @Column({
    nullable: true,
  })
  section?: string

  @Column()
  method!: string

  @Column({
    type: 'jsonb',
  })
  phase!: AnyJson

  @Column()
  @Index()
  blockNumber!: number

  @Column()
  index!: number

  @Column({
    type: 'jsonb',
  })
  params!: EventParam[]

  @OneToOne(
    () => SubstrateExtrinsicEntity,
    (e: SubstrateExtrinsicEntity) => e.event,
    {
      cascade: true,
      nullable: true,
    }
  )
  @JoinColumn()
  extrinsic?: SubstrateExtrinsicEntity

  static fromQueryEvent(q: IQueryEvent): SubstrateEventEntity {
    const _entity = new SubstrateEventEntity()

    _entity.blockNumber = q.blockNumber
    _entity.index = q.indexInBlock
    _entity.id = formatEventId(_entity.blockNumber, _entity.index)
    _entity.method = q.eventRecord.event.method || 'NO_METHOD'
    _entity.section = q.eventRecord.event.section || 'NO_SECTION'
    _entity.name = `${_entity.section}.${_entity.method}`
    _entity.phase = (q.eventRecord.phase.toJSON() || {}) as AnyJson

    _entity.params = []

    const { event } = q.eventRecord

    if (event.data.length) {
      q.eventRecord.event.data.forEach((data, index) => {
        _entity.params.push({
          type: event.typeDef[index].type,
          name:
            event.typeDef[index].name ||
            event.typeDef[index].displayName ||
            'NO_NAME',
          value: data ? data.toJSON() : {},
        } as EventParam)
      })
    }

    if (q.extrinsic) {
      const e = q.extrinsic
      const extr = new SubstrateExtrinsicEntity()
      _entity.extrinsic = extr

      extr.blockNumber = q.blockNumber
      extr.signature = e.signature.toString()
      extr.signer = e.signer.toString()
      extr.method = e.method.methodName || 'NO_METHOD'
      extr.section = e.method.sectionName || 'NO_SECTION'
      extr.meta = (e.meta.toJSON() || {}) as AnyJson
      extr.hash = e.hash.toString()
      extr.isSigned = e.isSigned
      ;(extr.tip = new BN(e.tip.toString())),
        (extr.versionInfo = e.version.toString())
      extr.nonce = e.nonce.toNumber()
      extr.era = (e.era.toJSON() || {}) as AnyJson

      extr.args = []

      e.method.args.forEach((data, index) => {
        extr.args.push({
          type: data.toRawType(),
          value: (data.toJSON() || '') as AnyJsonField,
          name: e.meta.args[index].name.toString(),
        })
      })
    }
    //debug(`Event entity: ${JSON.stringify(_entity, null, 2)}`);

    return _entity
  }
}
