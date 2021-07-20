import { BaseModel, BooleanField, Model, OneToMany, EnumField, StringField } from 'warthog';

import { DataObject } from '../data-object/data-object.model';

import { WorkerType } from '../enums/enums';
export { WorkerType };

@Model({ api: {} })
export class Worker extends BaseModel {
  @BooleanField({
    description: `Sign of worker still being active`,
  })
  isActive!: boolean;

  @StringField({
    description: `Runtime identifier`,
  })
  workerId!: string;

  @EnumField('WorkerType', WorkerType, {
    description: `Associated working group`,
  })
  type!: WorkerType;

  @StringField({
    nullable: true,
    description: `Custom metadata set by provider`,
  })
  metadata?: string;

  @OneToMany(() => DataObject, (param: DataObject) => param.liaison, {
    modelName: 'Worker',
    relModelName: 'DataObject',
    propertyName: 'dataObjects',
  })
  dataObjects?: DataObject[];

  constructor(init?: Partial<Worker>) {
    super();
    Object.assign(this, init);
  }
}
