import {
  BaseModel,
  BooleanField,
  IntField,
  Model,
  ManyToOne,
  OneToMany,
  CustomField,
  EnumField,
  StringField,
} from 'warthog';

import { Membership } from '../membership/membership.model';
import { CuratorGroup } from '../curator-group/curator-group.model';
import { ChannelCategory } from '../channel-category/channel-category.model';
import { DataObject } from '../data-object/data-object.model';
import { Language } from '../language/language.model';
import { Video } from '../video/video.model';

import { AssetAvailability } from '../enums/enums';
export { AssetAvailability };

@Model({ api: {} })
export class Channel extends BaseModel {
  @ManyToOne(() => Membership, (param: Membership) => param.channels, {
    skipGraphQLField: true,
    nullable: true,
    cascade: ["insert", "update"],
    modelName: 'Channel',
    relModelName: 'Membership',
    propertyName: 'ownerMember',
  })
  ownerMember?: Membership;

  @ManyToOne(() => CuratorGroup, (param: CuratorGroup) => param.channels, {
    skipGraphQLField: true,
    nullable: true,
    cascade: ["insert", "update"],
    modelName: 'Channel',
    relModelName: 'CuratorGroup',
    propertyName: 'ownerCuratorGroup',
  })
  ownerCuratorGroup?: CuratorGroup;

  @ManyToOne(() => ChannelCategory, (param: ChannelCategory) => param.channels, {
    skipGraphQLField: true,
    nullable: true,
    cascade: ["insert", "update"],
    modelName: 'Channel',
    relModelName: 'ChannelCategory',
    propertyName: 'category',
  })
  category?: ChannelCategory;

  @StringField({
    nullable: true,
    description: `Reward account where revenue is sent if set.`,
  })
  rewardAccount?: string;

  @StringField({
    nullable: true,
    description: `The title of the Channel`,
  })
  title?: string;

  @StringField({
    nullable: true,
    description: `The description of a Channel`,
  })
  description?: string;

  @IntField({
    description: `Count of channel's videos with an uploaded asset that are public and not censored.`,
  })
  activeVideosCounter!: number;

  @ManyToOne(() => DataObject, (param: DataObject) => param.channelcoverPhotoDataObject, {
    skipGraphQLField: true,
    nullable: true,
    cascade: ["insert", "update"],
    modelName: 'Channel',
    relModelName: 'DataObject',
    propertyName: 'coverPhotoDataObject',
  })
  coverPhotoDataObject?: DataObject;

  @CustomField({
    db: { type: 'text', array: true },
    api: { type: 'string', description: `URLs where the asset content can be accessed (if any)` },
  })
  coverPhotoUrls!: string[];

  @EnumField('AssetAvailability', AssetAvailability, {
    description: `Availability meta information`,
  })
  coverPhotoAvailability!: AssetAvailability;

  @ManyToOne(() => DataObject, (param: DataObject) => param.channelavatarPhotoDataObject, {
    skipGraphQLField: true,
    nullable: true,
    cascade: ["insert", "update"],
    modelName: 'Channel',
    relModelName: 'DataObject',
    propertyName: 'avatarPhotoDataObject',
  })
  avatarPhotoDataObject?: DataObject;

  @CustomField({
    db: { type: 'text', array: true },
    api: { type: 'string', description: `URLs where the asset content can be accessed (if any)` },
  })
  avatarPhotoUrls!: string[];

  @EnumField('AssetAvailability', AssetAvailability, {
    description: `Availability meta information`,
  })
  avatarPhotoAvailability!: AssetAvailability;

  @BooleanField({
    nullable: true,
    description: `Flag signaling whether a channel is public.`,
  })
  isPublic?: boolean;

  @BooleanField({
    description: `Flag signaling whether a channel is censored.`,
  })
  isCensored!: boolean;

  @ManyToOne(() => Language, (param: Language) => param.channellanguage, {
    skipGraphQLField: true,
    nullable: true,
    cascade: ["insert", "update"],
    modelName: 'Channel',
    relModelName: 'Language',
    propertyName: 'language',
  })
  language?: Language;

  @OneToMany(() => Video, (param: Video) => param.channel, {
    cascade: ["insert", "update"],
    modelName: 'Channel',
    relModelName: 'Video',
    propertyName: 'videos',
  })
  videos?: Video[];

  @IntField({})
  createdInBlock!: number;

  constructor(init?: Partial<Channel>) {
    super();
    Object.assign(this, init);
  }
}
