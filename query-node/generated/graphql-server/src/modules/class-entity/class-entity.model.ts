import { BaseModel, IntField, Model, ManyToOne, StringField } from 'warthog';

import { Block } from '../block/block.model';

@Model({
  api: {
    description: `This type is to keep which entity belongs to which class. This type will be used
by EntityCreated event. When a new schema support added to an Entity we will get the
class name from this table.
We need this because we can't create a database row (Channel, Video etc) without
with empty fields.`,
  },
})
export class ClassEntity extends BaseModel {
  @IntField({
    description: `The class id of this entity`,
  })
  classId!: number;

  @ManyToOne(() => Block, (param: Block) => param.classEntitys, {
    skipGraphQLField: true,
  })
  happenedIn!: Block;

  constructor(init?: Partial<ClassEntity>) {
    super();
    Object.assign(this, init);
  }
}
