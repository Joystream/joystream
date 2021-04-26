import { BaseModel, Model, EnumField, StringField } from 'warthog';

import { StorageProviderType } from '../enums/enums';
export { StorageProviderType };

@Model({ api: {} })
export class StorageProvider extends BaseModel {
  @EnumField('StorageProviderType', StorageProviderType, {})
  type!: StorageProviderType;

  @StringField({
    nullable: true,
    description: `Custom metadata set by provider`,
  })
  metadata?: string;

  constructor(init?: Partial<StorageProvider>) {
    super();
    Object.assign(this, init);
  }
}
