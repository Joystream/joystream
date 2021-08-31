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

import { ObjectType, Field, createUnionType } from 'type-graphql';

@ObjectType()
export class DataObjectOwnerChannel {
  public isTypeOf: string = 'DataObjectOwnerChannel';

  @IntField({
    description: `Channel identifier`,
  })
  channel!: number;

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

  @IntField({
    description: `DAO identifier`,
  })
  dao!: number;
}
@ObjectType()
export class DataObjectOwnerMember {
  public isTypeOf: string = 'DataObjectOwnerMember';

  @IntField({
    description: `Member identifier`,
  })
  member!: number;

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
