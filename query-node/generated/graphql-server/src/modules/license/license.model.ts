import { BaseModel, IntField, Model, OneToMany, StringField } from 'warthog';

import { Video } from '../video/video.model';

@Model({ api: {} })
export class License extends BaseModel {
  @IntField({
    nullable: true,
    description: `License code defined by Joystream`,
  })
  code?: number;

  @StringField({
    nullable: true,
    description: `Attribution (if required by the license)`,
  })
  attribution?: string;

  @StringField({
    nullable: true,
    description: `Custom license content`,
  })
  customText?: string;

  @OneToMany(() => Video, (param: Video) => param.license, { 
    nullable: true,
    cascade: ["insert", "update"],
    modelName: 'License',
    relModelName: 'Video',
    propertyName: 'videolanguage',
  })
  videolicense?: Video[];

  constructor(init?: Partial<License>) {
    super();
    Object.assign(this, init);
  }
}
