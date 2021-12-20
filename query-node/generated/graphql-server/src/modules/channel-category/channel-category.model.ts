import { BaseModel, IntField, Model, OneToMany, StringField } from 'warthog';

import { Channel } from '../channel/channel.model';

@Model({ api: { description: `Category of media channel` } })
export class ChannelCategory extends BaseModel {
  @StringField({
    nullable: true,
    description: `The name of the category`,
  })
  name?: string;

  @IntField({
    description: `Count of channel's videos with an uploaded asset that are public and not censored.`,
  })
  activeVideosCounter!: number;

  @OneToMany(() => Channel, (param: Channel) => param.category, {
    modelName: 'ChannelCategory',
    relModelName: 'Channel',
    propertyName: 'channels',
  })
  channels?: Channel[];

  @IntField({})
  createdInBlock!: number;

  constructor(init?: Partial<ChannelCategory>) {
    super();
    Object.assign(this, init);
  }
}
