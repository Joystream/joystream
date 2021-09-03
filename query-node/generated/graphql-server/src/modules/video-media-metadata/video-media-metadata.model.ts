import { BaseModel, IntField, FloatField, Model, ManyToOne, OneToOne, OneToOneJoin, StringField } from 'warthog';

import { VideoMediaEncoding } from '../video-media-encoding/video-media-encoding.model';
import { Video } from '../video/video.model';

@Model({ api: {} })
export class VideoMediaMetadata extends BaseModel {
  @ManyToOne(() => VideoMediaEncoding, (param: VideoMediaEncoding) => param.videomediametadataencoding, {
    skipGraphQLField: true,
    nullable: true,
    cascade: ["insert", "update"],
    modelName: 'VideoMediaMetadata',
    relModelName: 'VideoMediaEncoding',
    propertyName: 'encoding',
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

  // Size is meant to be integer, but since `IntField` represents only 4-bytes long number
  // (sadly, `dataType: bigint` settings only fixes DB, but GraphQL server still uses 4-bytes)
  // `NumericField` seems to always return string (when using transform directive number<->string)
  // `FloatField` field fixes this issue.
  @FloatField({
    nullable: true,
    description: `Video media size in bytes`,
  })
  size?: number;

  @OneToOne(() => Video, (param: Video) => param.mediaMetadata, { 
    nullable: true, cascade: ["insert", "update"],
    modelName: 'VideoMediaMetadata',
    relModelName: 'Video',
    propertyName: 'video',
  })
  video?: Video;

  @IntField({})
  createdInBlock!: number;

  constructor(init?: Partial<VideoMediaMetadata>) {
    super();
    Object.assign(this, init);
  }
}
