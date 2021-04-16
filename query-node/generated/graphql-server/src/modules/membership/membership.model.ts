import { BaseModel, IntField, Model, OneToMany, EnumField, StringField } from 'warthog';

import { Channel } from '../channel/channel.model';

import { MembershipEntryMethod } from '../enums/enums';
export { MembershipEntryMethod };

@Model({ api: { description: `Stored information about a registered user` } })
export class Membership extends BaseModel {
  @StringField({
    description: `The unique handle chosen by member`,
    unique: true,
  })
  handle!: string;

  @StringField({
    nullable: true,
    description: `A Url to member's Avatar image`,
  })
  avatarUri?: string;

  @StringField({
    nullable: true,
    description: `Short text chosen by member to share information about themselves`,
  })
  about?: string;

  @StringField({
    description: `Member's controller account id`,
  })
  controllerAccount!: string;

  @StringField({
    description: `Member's root account id`,
  })
  rootAccount!: string;

  @IntField({
    description: `Blocknumber when member was registered`,
  })
  createdInBlock!: number;

  @EnumField('MembershipEntryMethod', MembershipEntryMethod, {
    description: `How the member was registered`,
  })
  entry!: MembershipEntryMethod;

  @IntField({
    nullable: true,
    description: `The type of subscription the member has purchased if any.`,
  })
  subscription?: number;

  @OneToMany(() => Channel, (param: Channel) => param.ownerMember, { cascade: ["insert", "update"] })
  channels?: Channel[];

  constructor(init?: Partial<Membership>) {
    super();
    Object.assign(this, init);
  }
}
