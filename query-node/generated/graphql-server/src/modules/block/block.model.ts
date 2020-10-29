import { BaseModel, IntField, Model, OneToMany, EnumField, StringField } from 'warthog';

import { Category } from '../category/category.model';
import { Channel } from '../channel/channel.model';
import { ClassEntity } from '../class-entity/class-entity.model';
import { HttpMediaLocation } from '../http-media-location/http-media-location.model';
import { JoystreamMediaLocation } from '../joystream-media-location/joystream-media-location.model';
import { KnownLicense } from '../known-license/known-license.model';
import { Language } from '../language/language.model';
import { Member } from '../member/member.model';
import { UserDefinedLicense } from '../user-defined-license/user-defined-license.model';
import { Video } from '../video/video.model';
import { VideoMedia } from '../video-media/video-media.model';

import { Network } from '../enums/enums';
export { Network };

@Model({ api: {} })
export class Block extends BaseModel {
  @IntField({})
  block!: number;

  @IntField({})
  timestamp!: number;

  @EnumField('Network', Network, {})
  nework!: Network;

  @OneToMany(() => Category, (param: Category) => param.happenedIn)
  categorys?: Category[];

  @OneToMany(() => Channel, (param: Channel) => param.happenedIn)
  channels?: Channel[];

  @OneToMany(() => ClassEntity, (param: ClassEntity) => param.happenedIn)
  classEntitys?: ClassEntity[];

  @OneToMany(() => HttpMediaLocation, (param: HttpMediaLocation) => param.happenedIn)
  httpMediaLocations?: HttpMediaLocation[];

  @OneToMany(() => JoystreamMediaLocation, (param: JoystreamMediaLocation) => param.happenedIn)
  joystreamMediaLocations?: JoystreamMediaLocation[];

  @OneToMany(() => KnownLicense, (param: KnownLicense) => param.happenedIn)
  knownLicenses?: KnownLicense[];

  @OneToMany(() => Language, (param: Language) => param.happenedIn)
  languages?: Language[];

  @OneToMany(() => Member, (param: Member) => param.happenedIn)
  members?: Member[];

  @OneToMany(() => UserDefinedLicense, (param: UserDefinedLicense) => param.happenedIn)
  userDefinedLicenses?: UserDefinedLicense[];

  @OneToMany(() => Video, (param: Video) => param.happenedIn)
  videos?: Video[];

  @OneToMany(() => VideoMedia, (param: VideoMedia) => param.happenedIn)
  videoMedias?: VideoMedia[];

  constructor(init?: Partial<Block>) {
    super();
    Object.assign(this, init);
  }
}
