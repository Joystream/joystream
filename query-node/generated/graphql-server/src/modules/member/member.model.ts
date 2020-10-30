import { BaseModel, IntField, BytesField, Model, ManyToOne, StringField } from 'warthog';

import { Block } from '../block/block.model';

@Model({ api: { description: `Stored information about a registered user` } })
export class Member extends BaseModel {
  @StringField({
    nullable: true,
    description: `The unique handle chosen by member`,
    unique: true,
  })
  handle?: string;

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

  @IntField({
    description: `Blocknumber when member was registered`,
  })
  registeredAtBlock!: number;

  @BytesField({
    description: `Member's controller account id`,
  })
  controllerAccount!: Buffer;

  @BytesField({
    description: `Member's root account id`,
  })
  rootAccount!: Buffer;

  @ManyToOne(() => Block, (param: Block) => param.members, {
    skipGraphQLField: true,
  })
  happenedIn!: Block;

  constructor(init?: Partial<Member>) {
    super();
    Object.assign(this, init);
  }
}
