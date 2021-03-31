import { BaseModel, IntField, Model, OneToMany, StringField } from 'warthog';

import { Video } from '../video/video.model';

@Model({ api: {} })
export class VideoCategory extends BaseModel {
  @StringField({
    nullable: true,
    description: `The name of the category`
  })
  name?: string;

  @OneToMany(
    () => Video,
    (param: Video) => param.category
  )
  videos?: Video[];

  @IntField({})
  happenedIn!: number;

  constructor(init?: Partial<VideoCategory>) {
    super();
    Object.assign(this, init);
  }
}
