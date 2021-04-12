import { BaseModel, Model, OneToOne, OneToOneJoin, StringField } from 'warthog';

import { Video } from '../video/video.model';

@Model({ api: {} })
export class FeaturedVideo extends BaseModel {
  @OneToOneJoin(() => Video, (param: Video) => param.featured, { cascade: ["insert", "update"] })
  video!: Video;

  constructor(init?: Partial<FeaturedVideo>) {
    super();
    Object.assign(this, init);
  }
}
