import { BaseModel, IntField, Model, OneToMany, StringField } from 'warthog';

import { Video } from '../video/video.model';

@Model({ api: {} })
export class VideoCategory extends BaseModel {
  @StringField({
    nullable: true,
    description: `The name of the category`,
  })
  name?: string;

  @IntField({
    description: `Count of channel's videos with an uploaded asset that are public and not censored.`,
  })
  activeVideosCounter!: number;

  @OneToMany(() => Video, (param: Video) => param.category, {
    cascade: ["insert", "update"],
    modelName: 'VideoCategory',
    relModelName: 'Video',
    propertyName: 'videos',
  })
  videos?: Video[];

  @IntField({})
  createdInBlock!: number;

  constructor(init?: Partial<VideoCategory>) {
    super();
    Object.assign(this, init);
  }
}
