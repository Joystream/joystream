import { BaseModel, Model, ManyToOne, StringField } from 'warthog';

import { Block } from '../block/block.model';

@Model({ api: {} })
export class JoystreamMediaLocation extends BaseModel {
  @StringField({
    description: `Id of the data object in the Joystream runtime dataDirectory module`,
    unique: true,
  })
  dataObjectId!: string;

  @ManyToOne(() => Block, (param: Block) => param.joystreamMediaLocations, {
    skipGraphQLField: true,
  })
  happenedIn!: Block;

  constructor(init?: Partial<JoystreamMediaLocation>) {
    super();
    Object.assign(this, init);
  }
}
