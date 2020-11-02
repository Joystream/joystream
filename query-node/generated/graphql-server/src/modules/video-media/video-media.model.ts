import { BaseModel, IntField, Model, ManyToOne, StringField } from 'warthog';

import { Block } from '../block/block.model';

@Model({ api: {} })
export class VideoMedia extends BaseModel {
  @IntField({
    description: `Encoding of the video media object`,
  })
  encodingId!: number;

  @IntField({
    description: `Video media width in pixels`,
  })
  pixelWidth!: number;

  @IntField({
    description: `Video media height in pixels`,
  })
  pixelHeight!: number;

  @IntField({
    nullable: true,
    description: `Video media size in bytes`,
  })
  size?: number;

  @IntField({})
  locationId!: number;

  @ManyToOne(() => Block, (param: Block) => param.videoMedias, {
    skipGraphQLField: true,
  })
  happenedIn!: Block;

  constructor(init?: Partial<VideoMedia>) {
    super();
    Object.assign(this, init);
  }
}
