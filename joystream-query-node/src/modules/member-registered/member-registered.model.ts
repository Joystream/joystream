import { BaseModel, IntField, Model, StringField } from 'warthog';

@Model()
export class MemberRegistered extends BaseModel {
  @IntField()
  memberId!: number;

  @StringField()
  accountId!: string;
}
