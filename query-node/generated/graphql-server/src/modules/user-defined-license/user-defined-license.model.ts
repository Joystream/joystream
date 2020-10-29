import { BaseModel, Model, ManyToOne, StringField } from 'warthog';

import { Block } from '../block/block.model';

@Model({ api: {} })
export class UserDefinedLicense extends BaseModel {
  @StringField({
    description: `Custom license content`,
  })
  content!: string;

  @ManyToOne(() => Block, (param: Block) => param.userDefinedLicenses, {
    skipGraphQLField: true,
  })
  happenedIn!: Block;

  constructor(init?: Partial<UserDefinedLicense>) {
    super();
    Object.assign(this, init);
  }
}
