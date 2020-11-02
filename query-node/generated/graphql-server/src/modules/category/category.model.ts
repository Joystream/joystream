import { BaseModel, Model, ManyToOne, StringField } from 'warthog';

import { Block } from '../block/block.model';

@Model({ api: {} })
export class Category extends BaseModel {
  @StringField({
    description: `The name of the category`,
    unique: true,
  })
  name!: string;

  @StringField({
    nullable: true,
    description: `The description of the category`,
  })
  description?: string;

  @ManyToOne(() => Block, (param: Block) => param.categorys, {
    skipGraphQLField: true,
  })
  happenedIn!: Block;

  constructor(init?: Partial<Category>) {
    super();
    Object.assign(this, init);
  }
}
