import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  Index,
} from 'typeorm'
import { AnyJson } from '../interfaces/json-types'
import * as BN from 'bn.js'
import { NumericTransformer } from '../db'
import { ExtrinsicArg, SubstrateExtrinsic } from '../interfaces'
import { SubstrateEventEntity } from './SubstrateEventEntity'
import { AbstractWarthogModel } from './AbstractWarthogModel'

export const EXTRINSIC_TABLE_NAME = 'substrate_extrinsic'

@Entity({
  name: EXTRINSIC_TABLE_NAME,
})
export class SubstrateExtrinsicEntity
  extends AbstractWarthogModel
  implements SubstrateExtrinsic {
  @PrimaryGeneratedColumn()
  id!: number

  @Column({
    type: 'numeric',
    transformer: new NumericTransformer(),
  })
  tip!: BN

  @Column({
    type: 'numeric',
  })
  @Index()
  blockNumber!: number

  @Column()
  versionInfo!: string

  @Column({
    type: 'jsonb',
  })
  meta!: AnyJson

  @Column()
  method!: string

  @Column()
  section!: string

  @Column({
    type: 'jsonb',
  })
  args!: ExtrinsicArg[]

  @Column()
  signer!: string

  @Column()
  signature!: string

  @Column()
  nonce!: number

  @Column({
    type: 'jsonb',
  })
  era!: AnyJson

  @Column()
  hash!: string

  @Column()
  isSigned!: boolean

  @OneToOne(
    () => SubstrateEventEntity,
    (event: SubstrateEventEntity) => event.extrinsic
  ) // specify inverse side as a second parameter
  event!: SubstrateEventEntity
}
