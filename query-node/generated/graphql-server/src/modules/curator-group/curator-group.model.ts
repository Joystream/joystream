import { BaseModel, BooleanField, NumericField, Model, OneToMany, CustomField, StringField } from 'warthog';

import BN from 'bn.js';

import { Channel } from '../channel/channel.model';

@Model({ api: {} })
export class CuratorGroup extends BaseModel {
  @CustomField({
    db: { type: 'numeric', array: true },
    api: { type: 'numeric', description: `Curators belonging to this group` },
  })
  curatorIds!: BN[];

  @BooleanField({
    description: `Is group active or not`,
  })
  isActive!: boolean;

  @OneToMany(() => Channel, (param: Channel) => param.ownerCuratorGroup, { cascade: ["insert", "update"] })
  channels?: Channel[];

  constructor(init?: Partial<CuratorGroup>) {
    super();
    Object.assign(this, init);
  }
}
