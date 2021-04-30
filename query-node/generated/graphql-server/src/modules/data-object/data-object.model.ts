import { BaseModel, IntField, Model, ManyToOne, OneToMany, EnumField, StringField } from 'warthog';

import { Column } from 'typeorm';
import { Field } from 'type-graphql';
import { WarthogField } from 'warthog';

import { DataObjectOwner } from '../variants/variants.model';

import { StorageProvider } from '../storage-provider/storage-provider.model';
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

  @IntField({
    dataType: 'bigint',
    description: `Content size in bytes`,
  })
  size!: number;

  @ManyToOne(() => StorageProvider, (param: StorageProvider) => param.dataObjects, {
    skipGraphQLField: true,
    nullable: true,
  })
  liaison?: StorageProvider;

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

  @OneToMany(() => Channel, (param: Channel) => param.coverPhotoDataObject, { nullable: true, cascade: ["insert", "update"] })
  channelcoverPhotoDataObject?: Channel[];

  @OneToMany(() => Channel, (param: Channel) => param.avatarPhotoDataObject, { nullable: true, cascade: ["insert", "update"] })
  channelavatarPhotoDataObject?: Channel[];

  @OneToMany(() => Video, (param: Video) => param.thumbnailPhotoDataObject, { nullable: true, cascade: ["insert", "update"] })
  videothumbnailPhotoDataObject?: Video[];

  @OneToMany(() => Video, (param: Video) => param.mediaDataObject, { nullable: true, cascade: ["insert", "update"] })
  videomediaDataObject?: Video[];

  constructor(init?: Partial<DataObject>) {
    super();
    Object.assign(this, init);
  }
}
