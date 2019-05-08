import { getTypeRegistry, u64, AccountId, Text, Bool } from '@polkadot/types';
import { Struct, Option, Vector } from '@polkadot/types/codec';
import { getTextPropAsString } from '@polkadot/joy-utils/types';

export class CategoryId extends u64 {}
export class OptionCategoryId extends Option.with(CategoryId) {}
export class VecCategoryId extends Vector.with(CategoryId) {}

export class ThreadId extends u64 {}
export class VecThreadId extends Vector.with(ThreadId) {}

export class ReplyId extends u64 {}
export class VecReplyId extends Vector.with(ReplyId) {}

export type CategoryType = {
  owner: AccountId,
  parent_id: OptionCategoryId,
  children_ids: VecCategoryId,
  locked: Bool,
  name: Text,
  text: Text
};

export class Category extends Struct {
  constructor (value: CategoryType) {
    super({
      owner: AccountId,
      parent_id: OptionCategoryId,
      children_ids: VecCategoryId,
      locked: Bool,
      name: Text,
      text: Text
    }, value);
  }

  get owner (): AccountId {
    return this.get('owner') as AccountId;
  }

  get parent_id (): CategoryId | undefined {
    const parentId = this.get('parent_id') as OptionCategoryId;
    return parentId && parentId.isSome ? parentId.unwrap() as CategoryId : undefined;
  }

  get children_ids (): VecCategoryId {
    return this.get('children_ids') as VecCategoryId;
  }

  get locked (): Bool {
    return this.get('locked') as Bool;
  }

  get name (): string {
    return getTextPropAsString(this, 'name');
  }

  get text (): string {
    return getTextPropAsString(this, 'text');
  }
}

export class Thread extends Struct {
  constructor (value: any) {
    super({
      owner: AccountId,
      category_id: CategoryId,
      locked: Bool,
      title: Text,
      text: Text
    }, value);
  }

  get owner (): AccountId {
    return this.get('owner') as AccountId;
  }

  get category_id (): CategoryId {
    return this.get('category_id') as CategoryId;
  }

  get locked (): Bool {
    return this.get('locked') as Bool;
  }

  get title (): string {
    return getTextPropAsString(this, 'title');
  }

  get text (): string {
    return getTextPropAsString(this, 'text');
  }
}

export class Reply extends Struct {
  constructor (value: any) {
    super({
      owner: AccountId,
      thread_id: ThreadId,
      text: Text
    }, value);
  }

  get owner (): AccountId {
    return this.get('owner') as AccountId;
  }

  get thread_id (): ThreadId {
    return this.get('thread_id') as ThreadId;
  }

  get text (): string {
    return getTextPropAsString(this, 'text');
  }
}

export function registerForumTypes () {
  try {
    getTypeRegistry().register({
      CategoryId,
      OptionCategoryId,
      VecCategoryId,
      Category,
      ThreadId,
      VecThreadId,
      Thread,
      ReplyId,
      VecReplyId,
      Reply
      // TODO add all custom types of forum module.
    });
  } catch (err) {
    console.error('Failed to register custom types of forum module', err);
  }
}
