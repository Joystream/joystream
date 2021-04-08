import {
  BaseModel,
  BooleanField,
  DateField,
  FloatField,
  IntField,
  NumericField,
  JSONField,
  BytesField,
  EnumField,
  StringField,
} from 'warthog';

import BN from 'bn.js';

import { ObjectType, Field, createUnionType } from 'type-graphql';

@ObjectType()
export class DataObjectOwnerChannel {
  public isTypeOf: string = 'DataObjectOwnerChannel';

  @NumericField({
    description: `Channel identifier`,
  })
  channel!: BN;

  @IntField({
    nullable: true,
    description: `Variant needs to have at least one property. This value is not used.`,
  })
  dummy?: number;
}
@ObjectType()
export class DataObjectOwnerCouncil {
  public isTypeOf: string = 'DataObjectOwnerCouncil';

  @IntField({
    nullable: true,
    description: `Variant needs to have at least one property. This value is not used.`,
  })
  dummy?: number;
}
@ObjectType()
export class DataObjectOwnerDao {
  public isTypeOf: string = 'DataObjectOwnerDao';

  @NumericField({
    description: `DAO identifier`,
  })
  dao!: BN;
}
@ObjectType()
export class DataObjectOwnerMember {
  public isTypeOf: string = 'DataObjectOwnerMember';

  @NumericField({
    description: `Member identifier`,
  })
  member!: BN;

  @IntField({
    nullable: true,
    description: `Variant needs to have at least one property. This value is not used.`,
  })
  dummy?: number;
}
@ObjectType()
export class DataObjectOwnerWorkingGroup {
  public isTypeOf: string = 'DataObjectOwnerWorkingGroup';

  @IntField({
    description: `Working group identifier`,
  })
  workingGroup!: number;
}

export const DataObjectOwner = createUnionType({
  name: 'DataObjectOwner',
  types: () => [
    DataObjectOwnerMember,
    DataObjectOwnerChannel,
    DataObjectOwnerDao,
    DataObjectOwnerCouncil,
    DataObjectOwnerWorkingGroup,
  ],
  resolveType: (value) => (value.isTypeOf ? value.isTypeOf : undefined),
});
