import { getTypeRegistry, u64, AccountId, Text, Bool } from '@polkadot/types';
import { Struct, Option, Vector } from '@polkadot/types/codec';
import { getTextPropAsString, getBoolPropAsBoolean, getOptionPropOrUndefined } from '@polkadot/joy-utils/types';
import { Codec } from '@polkadot/types/types';

export class JoyStruct<T extends { [K: string]: Codec }> extends Struct {

  getRequired <C extends Codec> (name: keyof T): C {
    return super.get(name as string) as C;
  }

  cloneValues (): T {
    const res: Partial<T> = {};
    super.forEach((v, k) => {
      res[k] = v;
    });
    return res as T;
  }
}

export type ModerationActionType = {
  // TODO occured_at: BlockchainTimestamp,
  moderator_id: AccountId,
  rationale: Text
};

export class ModerationAction extends JoyStruct<ModerationActionType> {
  constructor (value: ModerationActionType) {
    super({
      // TODO occured_at: BlockchainTimestamp,
      moderator_id: AccountId,
      rationale: Text
    }, value);
  }

  get moderator_id (): AccountId {
    return this.get('moderator_id') as AccountId;
  }

  get rationale (): string {
    return getTextPropAsString(this, 'rationale');
  }
}

export class OptionModerationAction extends Option.with(ModerationAction) {}

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
  deleted: Bool,
  archived: Bool,
  name: Text,
  text: Text
};

export class Category extends JoyStruct<CategoryType> {
  constructor (value: CategoryType) {
    super({
      owner: AccountId,
      parent_id: OptionCategoryId,
      children_ids: VecCategoryId,
      deleted: Bool,
      archived: Bool,
      name: Text,
      text: Text
    }, value);
  }

  get owner (): AccountId {
    return this.get('owner') as AccountId;
  }

  get parent_id (): CategoryId | undefined {
    return getOptionPropOrUndefined(this, 'parent_id');
  }

  get children_ids (): VecCategoryId {
    return this.get('children_ids') as VecCategoryId;
  }

  get deleted (): boolean {
    return getBoolPropAsBoolean(this, 'deleted');
  }

  get archived (): boolean {
    return getBoolPropAsBoolean(this, 'archived');
  }

  get name (): string {
    return getTextPropAsString(this, 'name');
  }

  get text (): string {
    return getTextPropAsString(this, 'text');
  }
}

export type ThreadType = {
  owner: AccountId,
  category_id: CategoryId,
  pinned: Bool,
  title: Text,
  text: Text,
  moderation: OptionModerationAction
};

export class Thread extends JoyStruct<ThreadType> {
  constructor (value: ThreadType) {
    super({
      owner: AccountId,
      category_id: CategoryId,
      pinned: Bool,
      title: Text,
      text: Text,
      moderation: OptionModerationAction
    }, value);
  }

  get owner (): AccountId {
    return this.get('owner') as AccountId;
  }

  get category_id (): CategoryId {
    return this.get('category_id') as CategoryId;
  }

  get pinned (): boolean {
    return getBoolPropAsBoolean(this, 'pinned');
  }

  get title (): string {
    return getTextPropAsString(this, 'title');
  }

  get text (): string {
    return getTextPropAsString(this, 'text');
  }

  get moderation (): ModerationAction | undefined {
    return getOptionPropOrUndefined(this, 'moderation');
  }
}

export type ReplyType = {
  owner: AccountId,
  thread_id: ThreadId,
  text: Text,
  moderation: OptionModerationAction
};

export class Reply extends JoyStruct<ReplyType> {
  constructor (value: ReplyType) {
    super({
      owner: AccountId,
      thread_id: ThreadId,
      text: Text,
      moderation: OptionModerationAction
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

  get moderation (): ModerationAction | undefined {
    return getOptionPropOrUndefined(this, 'moderation');
  }
}

export function registerForumTypes () {
  try {
    getTypeRegistry().register({
      ModerationAction,
      CategoryId,
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
