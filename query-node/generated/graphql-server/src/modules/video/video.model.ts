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

import { AssetAvailability } from '../enums/enums';
export { AssetAvailability };

@Model({ api: {} })
export class Video extends BaseModel {
  @ManyToOne(() => Channel, (param: Channel) => param.videos, {
    skipGraphQLField: true,
    nullable: true,
    cascade: ["insert", "update"],
    modelName: 'Video',
    relModelName: 'Channel',
    propertyName: 'channel',
  })
  channel!: Channel;

  @ManyToOne(() => VideoCategory, (param: VideoCategory) => param.videos, {
    skipGraphQLField: true,
    nullable: true,
    cascade: ["insert", "update"],
    modelName: 'Video',
    relModelName: 'VideoCategory',
    propertyName: 'category',
  })
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

  @ManyToOne(() => DataObject, (param: DataObject) => param.videothumbnailPhotoDataObject, {
    skipGraphQLField: true,
    nullable: true,
    cascade: ["insert", "update"],
    modelName: 'Video',
    relModelName: 'DataObject',
    propertyName: 'thumbnailPhotoDataObject',
  })
  thumbnailPhotoDataObject?: DataObject;

  @CustomField({
    db: { type: 'text', array: true },
    api: { type: 'string', description: `URLs where the asset content can be accessed (if any)` },
  })
  thumbnailPhotoUrls!: string[];

  @EnumField('AssetAvailability', AssetAvailability, {
    description: `Availability meta information`,
  })
  thumbnailPhotoAvailability!: AssetAvailability;

  @ManyToOne(() => Language, (param: Language) => param.videolanguage, {
    skipGraphQLField: true,
    nullable: true,
    cascade: ["insert", "update"],
    modelName: 'Video',
    relModelName: 'Language',
    propertyName: 'language',
  })
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

  @ManyToOne(() => License, (param: License) => param.videolicense, {
    skipGraphQLField: true,
    nullable: true,
    cascade: ["insert", "update"],
    modelName: 'Video',
    relModelName: 'License',
    propertyName: 'license',
  })
  license?: License;

  @ManyToOne(() => DataObject, (param: DataObject) => param.videomediaDataObject, {
    skipGraphQLField: true,
    nullable: true,
    cascade: ["insert", "update"],
    modelName: 'Video',
    relModelName: 'DataObject',
    propertyName: 'mediaDataObject',
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

  @OneToOneJoin(() => VideoMediaMetadata, (param: VideoMediaMetadata) => param.video, {
    nullable: true,
    cascade: ["insert", "update"],
    modelName: 'Video',
    relModelName: 'VideoMediaMetadata',
    propertyName: 'mediaMetadata',
  })
  mediaMetadata?: VideoMediaMetadata;

  @IntField({})
  createdInBlock!: number;

  @BooleanField({
    description: `Is video featured or not`,
  })
  isFeatured!: boolean;

  constructor(init?: Partial<Video>) {
    super();
    Object.assign(this, init);
  }
}
