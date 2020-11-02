import { BaseModel, Model, ManyToOne, StringField } from 'warthog';

import { Block } from '../block/block.model';

@Model({ api: {} })
export class KnownLicense extends BaseModel {
  @StringField({
    description: `Short, commonly recognized code of the licence (ie. CC_BY_SA)`,
    unique: true,
  })
  code!: string;

  @StringField({
    nullable: true,
    description: `Full, descriptive name of the license (ie. Creative Commons - Attribution-NonCommercial-NoDerivs)`,
  })
  name?: string;

  @StringField({
    nullable: true,
    description: `Short description of the license conditions`,
  })
  description?: string;

  @StringField({
    nullable: true,
    description: `An url pointing to full license content`,
  })
  url?: string;

  @ManyToOne(() => Block, (param: Block) => param.knownLicenses, {
    skipGraphQLField: true,
  })
  happenedIn!: Block;

  constructor(init?: Partial<KnownLicense>) {
    super();
    Object.assign(this, init);
  }
}
