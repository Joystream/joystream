import { BaseModel, Model, StringField } from 'warthog';

@Model({ api: { description: `Encoding and containers` } })
export class VideoMediaEncoding extends BaseModel {
  @StringField({})
  name!: string;

  constructor(init?: Partial<VideoMediaEncoding>) {
    super();
    Object.assign(this, init);
  }
}
