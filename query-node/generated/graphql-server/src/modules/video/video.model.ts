import {
  BaseModel,
  BooleanField,
  IntField,
  DateTimeField,
  Model,
  ManyToOne,
  OneToOne,
  OneToOneJoin,
  CustomField,
  EnumField,
  StringField,
} from 'warthog';

import { Channel } from '../channel/channel.model';
import { VideoCategory } from '../video-category/video-category.model';
import { DataObject } from '../data-object/data-object.model';
import { Language } from '../language/language.model';
import { License } from '../license/license.model';
import { VideoMediaMetadata } from '../video-media-metadata/video-media-metadata.model';
import { FeaturedVideo } from '../featured-video/featured-video.model';

import { AssetAvailability } from '../enums/enums';
export { AssetAvailability };

@Model({ api: {} })
export class Video extends BaseModel {
  @ManyToOne(() => Channel, (param: Channel) => param.videos, { skipGraphQLField: true })
  channel!: Channel;

  @ManyToOne(() => VideoCategory, (param: VideoCategory) => param.videos, { skipGraphQLField: true, nullable: true })
  category?: VideoCategory;

  @StringField({
    nullable: true,
    description: `The title of the video`,
  })
  title?: string;

  @StringField({
    nullable: true,
    description: `The description of the Video`,
  })
  description?: string;

  @IntField({
    nullable: true,
    description: `Video duration in seconds`,
  })
  duration?: number;

  @ManyToOne(() => DataObject, (param: DataObject) => param.videothumbnailDataObject, {
    skipGraphQLField: true,
    nullable: true,
  })
  thumbnailDataObject?: DataObject;

  @CustomField({
    db: { type: 'text', array: true },
    api: { type: 'string', description: `URLs where the asset content can be accessed (if any)` },
  })
  thumbnailUrls!: string[];

  @EnumField('AssetAvailability', AssetAvailability, {
    description: `Availability meta information`,
  })
  thumbnailAvailability!: AssetAvailability;

  @ManyToOne(() => Language, (param: Language) => param.videolanguage, { skipGraphQLField: true, nullable: true })
  language?: Language;

  @BooleanField({
    nullable: true,
    description: `Whether or not Video contains marketing`,
  })
  hasMarketing?: boolean;

  @DateTimeField({
    nullable: true,
    description: `If the Video was published on other platform before beeing published on Joystream - the original publication date`,
  })
  publishedBeforeJoystream?: Date;

  @BooleanField({
    nullable: true,
    description: `Whether the Video is supposed to be publically displayed`,
  })
  isPublic?: boolean;

  @BooleanField({
    description: `Flag signaling whether a video is censored.`,
  })
  isCensored!: boolean;

  @BooleanField({
    nullable: true,
    description: `Whether the Video contains explicit material.`,
  })
  isExplicit?: boolean;

  @ManyToOne(() => License, (param: License) => param.videolicense, { skipGraphQLField: true, nullable: true })
  license?: License;

  @ManyToOne(() => DataObject, (param: DataObject) => param.videomediaDataObject, {
    skipGraphQLField: true,
    nullable: true,
  })
  mediaDataObject?: DataObject;

  @CustomField({
    db: { type: 'text', array: true },
    api: { type: 'string', description: `URLs where the asset content can be accessed (if any)` },
  })
  mediaUrls!: string[];

  @EnumField('AssetAvailability', AssetAvailability, {
    description: `Availability meta information`,
  })
  mediaAvailability!: AssetAvailability;

  @OneToOneJoin(() => VideoMediaMetadata, (param: VideoMediaMetadata) => param.video, { nullable: true })
  mediaMetadata?: VideoMediaMetadata;

  @IntField({})
  createdInBlock!: number;

  @BooleanField({
    description: `Is video featured or not`,
  })
  isFeatured!: boolean;

  @OneToOne(() => FeaturedVideo, (param: FeaturedVideo) => param.video, { nullable: true })
  featured?: FeaturedVideo;

  constructor(init?: Partial<Video>) {
    super();
    Object.assign(this, init);
  }
}
