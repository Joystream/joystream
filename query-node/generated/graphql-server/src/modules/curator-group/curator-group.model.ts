import { BaseModel, BooleanField, IntField, Model, OneToMany, CustomField, StringField } from 'warthog';

import { Channel } from '../channel/channel.model';

@Model({ api: {} })
export class CuratorGroup extends BaseModel {
  @CustomField({
    db: { type: 'integer', array: true },
    api: { type: 'integer', description: `Curators belonging to this group` },
  })
  curatorIds!: number[];

  @BooleanField({
    description: `Is group active or not`,
  })
  isActive!: boolean;

  @OneToMany(() => Channel, (param: Channel) => param.ownerCuratorGroup, { 
    cascade: ["insert", "update"],
    modelName: 'CuratorGroup',
    relModelName: 'Channel',
    propertyName: 'channels',
  })
  channels?: Channel[];

  constructor(init?: Partial<CuratorGroup>) {
    super();
    Object.assign(this, init);
  }
}
