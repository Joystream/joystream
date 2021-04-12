import { BaseModel, Model, OneToMany, StringField } from 'warthog';

import { VideoMediaMetadata } from '../video-media-metadata/video-media-metadata.model';

@Model({ api: {} })
export class VideoMediaEncoding extends BaseModel {
  @StringField({
    nullable: true,
    description: `Encoding of the video media object`,
  })
  codecName?: string;

  @StringField({
    nullable: true,
    description: `Media container format`,
  })
  container?: string;

  @StringField({
    nullable: true,
    description: `Content MIME type`,
  })
  mimeMediaType?: string;

  @OneToMany(() => VideoMediaMetadata, (param: VideoMediaMetadata) => param.encoding, { nullable: true, cascade: ["insert", "update"] })
  videomediametadataencoding?: VideoMediaMetadata[];

  constructor(init?: Partial<VideoMediaEncoding>) {
    super();
    Object.assign(this, init);
  }
}
