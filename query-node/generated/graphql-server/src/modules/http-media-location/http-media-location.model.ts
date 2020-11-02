import { BaseModel, IntField, Model, ManyToOne, StringField } from 'warthog';

import { Block } from '../block/block.model';

@Model({ api: {} })
export class HttpMediaLocation extends BaseModel {
  @StringField({
    description: `The http url pointing to the media`,
  })
  url!: string;

  @IntField({
    nullable: true,
    description: `The port to use when connecting to the http url (defaults to 80)`,
  })
  port?: number;

  @ManyToOne(() => Block, (param: Block) => param.httpMediaLocations, {
    skipGraphQLField: true,
  })
  happenedIn!: Block;

  constructor(init?: Partial<HttpMediaLocation>) {
    super();
    Object.assign(this, init);
  }
}
