import { BaseModel, BooleanField, Model, OneToMany, EnumField, StringField } from 'warthog';

import { DataObject } from '../data-object/data-object.model';

import { StorageProviderType } from '../enums/enums';
export { StorageProviderType };

@Model({ api: {} })
export class StorageProvider extends BaseModel {
  @BooleanField({})
  isActive!: boolean;

  @EnumField('StorageProviderType', StorageProviderType, {})
  type!: StorageProviderType;

  @StringField({
    nullable: true,
    description: `Custom metadata set by provider`,
  })
  metadata?: string;

  @OneToMany(() => DataObject, (param: DataObject) => param.liaison, { cascade: ["insert", "update"] })
  dataObjects?: DataObject[];

  constructor(init?: Partial<StorageProvider>) {
    super();
    Object.assign(this, init);
  }
}
