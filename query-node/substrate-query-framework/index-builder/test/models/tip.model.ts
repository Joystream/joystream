import { BaseModel, BooleanField, NumericField, BytesField, Model, OneToMany } from 'warthog';

import * as BN from 'bn.js';

import { Tipper } from './tipper.model';

@Model({ api: {} })
export class Tip extends BaseModel {
  @BytesField({
    description: `The hash of the reason for the tip.`,
    unique: true,
  })
  reason!: Buffer;

  @BytesField({
    description: `The account to be tipped.`,
  })
  who!: Buffer;

  @BytesField({
    description: `The account who began this tip.`,
  })
  finder!: Buffer;

  @NumericField({
    nullable: true,
    description: `The amount held on deposit for this tip.`,

    transformer: {
      to: (entityValue: BN) => (entityValue !== undefined ? entityValue.toString(10) : null),
      from: (dbValue: string) => dbValue !== undefined && dbValue !== null && dbValue.length > 0 ? new BN(dbValue, 10) : undefined,
    },
  })
  deposit?: BN;

  @NumericField({
    nullable: true,
    description: `The block number at which this tip will close if Some.`,

    transformer: {
      to: (entityValue: BN) => (entityValue !== undefined ? entityValue.toString(10) : null),
      from: (dbValue: string) => dbValue !== undefined && dbValue !== null && dbValue.length > 0 ? new BN(dbValue, 10) : undefined,
    },
  })
  closes?: BN;

  @OneToMany(() => Tipper, (param: Tipper) => param.tip)
  tippers?: Tipper[];

  @BooleanField({
    description: `Whether this tip should result in the finder taking a fee.`,
  })
  findersFee!: boolean;

  @BooleanField({
    description: `Cancel the process of tipping`,
  })
  retracted!: boolean;
}
