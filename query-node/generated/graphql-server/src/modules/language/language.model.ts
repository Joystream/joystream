import { BaseModel, IntField, Model, OneToMany, StringField } from 'warthog';

import { Channel } from '../channel/channel.model';
import { Video } from '../video/video.model';

@Model({ api: {} })
export class Language extends BaseModel {
  @StringField({
    description: `Language identifier ISO 639-1`,
  })
  iso!: string;

  @IntField({})
  createdInBlock!: number;

  @OneToMany(() => Channel, (param: Channel) => param.language, {
    nullable: true, cascade: ["insert", "update"],
    modelName: 'Language',
    relModelName: 'Channel',
    propertyName: 'channellanguage',
  })
  channellanguage?: Channel[];

  @OneToMany(() => Video, (param: Video) => param.language, {
    nullable: true, cascade: ["insert", "update"],
    modelName: 'Language',
    relModelName: 'Video',
    propertyName: 'videolanguage',
  })
  videolanguage?: Video[];

  constructor(init?: Partial<Language>) {
    super();
    Object.assign(this, init);
  }
}
