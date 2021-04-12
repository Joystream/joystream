import { BaseModel, IntField, NumericField, Model, ManyToOne, OneToOne, OneToOneJoin, StringField } from 'warthog';

import BN from 'bn.js';

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

  @NumericField({
    nullable: true,
    description: `Video media size in bytes`,

    transformer: {
      to: (entityValue: BN) => (entityValue !== undefined ? entityValue.toString(10) : null),
      from: (dbValue: string) =>
        dbValue !== undefined && dbValue !== null && dbValue.length > 0 ? new BN(dbValue, 10) : undefined,
    },
  })
  size?: BN;

  @OneToOne(() => Video, (param: Video) => param.mediaMetadata, { nullable: true, cascade: ["insert", "update"] })
  video?: Video;

  @IntField({})
  createdInBlock!: number;

  constructor(init?: Partial<VideoMediaMetadata>) {
    super();
    Object.assign(this, init);
  }
}
