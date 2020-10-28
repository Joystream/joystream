import { BaseModel, Model, ManyToOne, StringField } from 'warthog';

import { Block } from '../block/block.model';

@Model({ api: {} })
export class Language extends BaseModel {
  @StringField({})
  name!: string;

  @StringField({})
  code!: string;

  @ManyToOne(() => Block, (param: Block) => param.languages, {
    skipGraphQLField: true,
  })
  happenedIn!: Block;

  constructor(init?: Partial<Language>) {
    super();
    Object.assign(this, init);
  }
}
