import { BaseModel, IntField, Model, OneToMany, StringField } from 'warthog';

import { Channel } from '../channel/channel.model';

@Model({ api: { description: `Category of media channel` } })
export class ChannelCategory extends BaseModel {
  @StringField({
    nullable: true,
    description: `The name of the category`,
  })
  name?: string;

  @OneToMany(() => Channel, (param: Channel) => param.category)
  channels?: Channel[];

  @IntField({})
  createdInBlock!: number;

  constructor(init?: Partial<ChannelCategory>) {
    super();
    Object.assign(this, init);
  }
}
