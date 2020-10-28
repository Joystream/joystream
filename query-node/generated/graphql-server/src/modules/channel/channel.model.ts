import { BaseModel, BooleanField, IntField, Model, ManyToOne, StringField } from 'warthog';

import { Block } from '../block/block.model';

@Model({ api: {} })
export class Channel extends BaseModel {
  @StringField({
    description: `The title of the Channel`,
  })
  title!: string;

  @StringField({
    description: `The description of a Channel`,
  })
  description!: string;

  @StringField({
    description: `Url for Channel's cover (background) photo. Recommended ratio: 16:9.`,
  })
  coverPhotoUrl!: string;

  @StringField({
    description: `Channel's avatar photo.`,
  })
  avatarPhotoUrl!: string;

  @BooleanField({
    description: `Flag signaling whether a channel is public.`,
  })
  isPublic!: boolean;

  @BooleanField({
    description: `Flag signaling whether a channel is curated/verified.`,
  })
  isCurated!: boolean;

  @IntField({
    nullable: true,
    description: `The primary langauge of the channel's content`,
  })
  languageId?: number;

  @ManyToOne(() => Block, (param: Block) => param.channels, {
    skipGraphQLField: true,
  })
  happenedIn!: Block;

  constructor(init?: Partial<Channel>) {
    super();
    Object.assign(this, init);
  }
}
