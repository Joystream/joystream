import { BaseModel, IntField, FloatField, Model, ManyToOne, OneToOne, OneToOneJoin, StringField } from 'warthog';

import { VideoMediaEncoding } from '../video-media-encoding/video-media-encoding.model';
import { Video } from '../video/video.model';

@Model({ api: {} })
export class VideoMediaMetadata extends BaseModel {
  @ManyToOne(() => VideoMediaEncoding, (param: VideoMediaEncoding) => param.videomediametadataencoding, {
    skipGraphQLField: true,
    nullable: true,
    cascade: ["insert", "update"],
  })
  encoding?: VideoMediaEncoding;

  @IntField({
    nullable: true,
    description: `Video media width in pixels`,
  })
  pixelWidth?: number;

  @IntField({
    nullable: true,
    description: `Video media height in pixels`,
  })
  pixelHeight?: number;

  @FloatField({
    nullable: true,
    description: `Video media size in bytes`,
  })
  size?: number;

  @OneToOne(() => Video, (param: Video) => param.mediaMetadata, { nullable: true, cascade: ["insert", "update"] })
  video?: Video;

  @IntField({})
  createdInBlock!: number;

  constructor(init?: Partial<VideoMediaMetadata>) {
    super();
    Object.assign(this, init);
  }
}
