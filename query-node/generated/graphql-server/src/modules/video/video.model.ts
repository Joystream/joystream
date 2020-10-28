import { BaseModel, BooleanField, IntField, Model, ManyToOne, StringField } from 'warthog';

import { Block } from '../block/block.model';

@Model({ api: {} })
export class Video extends BaseModel {
  @IntField({
    description: `Reference to member's channel`,
  })
  channelId!: number;

  @IntField({
    description: `Reference to a video category`,
  })
  categoryId!: number;

  @StringField({
    description: `The title of the video`,
  })
  title!: string;

  @StringField({
    description: `The description of the Video`,
  })
  description!: string;

  @IntField({
    description: `Video duration in seconds`,
  })
  duration!: number;

  @IntField({
    nullable: true,
    description: `Video's skippable intro duration in seconds`,
  })
  skippableIntroDuration?: number;

  @StringField({
    description: `Video thumbnail url (recommended ratio: 16:9)`,
  })
  thumbnailUrl!: string;

  @IntField({
    nullable: true,
    description: `Video's main langauge`,
  })
  languageId?: number;

  @IntField({
    description: `Reference to VideoMedia`,
  })
  videoMediaId!: number;

  @BooleanField({
    nullable: true,
    description: `Whether or not Video contains marketing`,
  })
  hasMarketing?: boolean;

  @IntField({
    nullable: true,
    description: `If the Video was published on other platform before beeing published on Joystream - the original publication date`,
  })
  publishedBeforeJoystream?: number;

  @BooleanField({
    description: `Whether the Video is supposed to be publically displayed`,
  })
  isPublic!: boolean;

  @BooleanField({
    description: `Video curation status set by the Curator`,
  })
  isCurated!: boolean;

  @BooleanField({
    description: `Whether the Video contains explicit material.`,
  })
  isExplicit!: boolean;

  @IntField({})
  licenseId!: number;

  @ManyToOne(() => Block, (param: Block) => param.videos, {
    skipGraphQLField: true,
  })
  happenedIn!: Block;

  constructor(init?: Partial<Video>) {
    super();
    Object.assign(this, init);
  }
}
