import { BaseModel, FloatField, IntField, Model, ManyToOne, OneToMany, EnumField, StringField } from 'warthog';

import { Column } from 'typeorm';
import { Field } from 'type-graphql';
import { WarthogField } from 'warthog';

import { DataObjectOwner } from '../variants/variants.model';

import { Worker } from '../worker/worker.model';
import { Channel } from '../channel/channel.model';
import { Video } from '../video/video.model';

import { LiaisonJudgement } from '../enums/enums';
export { LiaisonJudgement };

@Model({ api: { description: `Manages content ids, type and storage provider decision about it` } })
export class DataObject extends BaseModel {
  @Column('jsonb')
  @WarthogField('json')
  @Field((type) => DataObjectOwner, {
    description: `Content owner`,
  })
  owner!: typeof DataObjectOwner;

  @IntField({
    description: `Content added at`,
  })
  createdInBlock!: number;

  @IntField({
    description: `Content type id`,
  })
  typeId!: number;

  // Size is meant to be integer, but since `IntField` represents only 4-bytes long number
  // (sadly, `dataType: bigint` settings only fixes DB, but GraphQL server still uses 4-bytes)
  // `NumericField` seems to always return string (when using transform directive number<->string)
  // `FloatField` field fixes this issue.
  @FloatField({
    description: `Content size in bytes`,
  })
  size!: number;

  @ManyToOne(() => Worker, (param: Worker) => param.dataObjects, {
    skipGraphQLField: true,
    nullable: true,
    modelName: 'DataObject',
    relModelName: 'Worker',
    propertyName: 'liaison',
  })
  liaison?: Worker;

  @EnumField('LiaisonJudgement', LiaisonJudgement, {
    description: `Storage provider as liaison judgment`,
  })
  liaisonJudgement!: LiaisonJudgement;

  @StringField({
    description: `IPFS content id`,
  })
  ipfsContentId!: string;

  @StringField({
    description: `Joystream runtime content`,
  })
  joystreamContentId!: string;

  @OneToMany(() => Channel, (param: Channel) => param.coverPhotoDataObject, {
    nullable: true,
    cascade: ["insert", "update"],
    modelName: 'DataObject',
    relModelName: 'Channel',
    propertyName: 'channelcoverPhotoDataObject',
  })
  channelcoverPhotoDataObject?: Channel[];

  @OneToMany(() => Channel, (param: Channel) => param.avatarPhotoDataObject, {
    nullable: true,
    cascade: ["insert", "update"],
    modelName: 'DataObject',
    relModelName: 'Channel',
    propertyName: 'channelavatarPhotoDataObject',
  })
  channelavatarPhotoDataObject?: Channel[];

  @OneToMany(() => Video, (param: Video) => param.thumbnailPhotoDataObject, {
    nullable: true,
    cascade: ["insert", "update"],
    modelName: 'DataObject',
    relModelName: 'VideoMediaMetadata',
    propertyName: 'videothumbnailPhotoDataObject',
  })
  videothumbnailPhotoDataObject?: Video[];

  @OneToMany(() => Video, (param: Video) => param.mediaDataObject, {
    nullable: true,
    cascade: ["insert", "update"],
    modelName: 'DataObject',
    relModelName: 'VideoMediaMetadata',
    propertyName: 'videomediaDataObject',
  })
  videomediaDataObject?: Video[];

  constructor(init?: Partial<DataObject>) {
    super();
    Object.assign(this, init);
  }
}
