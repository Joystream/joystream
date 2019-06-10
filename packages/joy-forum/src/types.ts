import { getTypeRegistry, u32, u64, AccountId, Text, Bool, BlockNumber, Moment } from '@polkadot/types';
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

// Based on copypasta from joy-media/BlockAndTimeType
export type BlockchainTimestampType = {
  block: BlockNumber,
  time: Moment
};

// Based on copypasta from joy-media/BlockAndTime
export class BlockchainTimestamp extends JoyStruct<BlockchainTimestampType> {
  constructor (value?: BlockchainTimestampType) {
    super({
      block: BlockNumber,
      time: Moment
    }, value);
  }

  get block (): BlockNumber {
    return this.getRequired('block');
  }

  get time (): Moment {
    return this.getRequired('time');
  }
}

export type ModerationActionType = {
  moderated_at: BlockchainTimestamp,
  moderator_id: AccountId,
  rationale: Text
};

export class ModerationAction extends JoyStruct<ModerationActionType> {
  constructor (value: ModerationActionType) {
    super({
      moderated_at: BlockchainTimestamp,
      moderator_id: AccountId,
      rationale: Text
    }, value);
  }

  get moderated_at (): BlockchainTimestamp {
    return this.getRequired('moderated_at');
  }

  get moderator_id (): AccountId {
    return this.getRequired('moderator_id');
  }

  get rationale (): string {
    return getTextPropAsString(this, 'rationale');
  }
}

export type PostTextChangeType = {
  expired_at: BlockchainTimestamp,
  text: Text
};

export class PostTextChange extends JoyStruct<PostTextChangeType> {
  constructor (value: PostTextChangeType) {
    super({
      expired_at: BlockchainTimestamp,
      text: Text
    }, value);
  }

  get expired_at (): BlockchainTimestamp {
    return this.getRequired('expired_at');
  }

  get text (): string {
    return getTextPropAsString(this, 'text');
  }
}

export class VecPostTextChange extends Vector.with(PostTextChange) {}

export class OptionModerationAction extends Option.with(ModerationAction) {}

export class CategoryId extends u64 {}
export class OptionCategoryId extends Option.with(CategoryId) {}
export class VecCategoryId extends Vector.with(CategoryId) {}

export class ThreadId extends u64 {}
export class VecThreadId extends Vector.with(ThreadId) {}

export class PostId extends u64 {}
export class VecPostId extends Vector.with(PostId) {}

// TODO deprectated: replaced w/ PostId
export class ReplyId extends u64 {}
export class VecReplyId extends Vector.with(ReplyId) {}

export type ChildPositionInParentCategoryType = {
  parent_id: CategoryId,
  child_nr_in_parent_category: u32
};

export class ChildPositionInParentCategory extends JoyStruct<ChildPositionInParentCategoryType> {
  constructor (value: ChildPositionInParentCategoryType) {
    super({
      parent_id: CategoryId,
      child_nr_in_parent_category: u32
    }, value);
  }

  get parent_id (): CategoryId {
    return this.getRequired('parent_id');
  }

  get child_nr_in_parent_category (): u32 {
    return this.getRequired('child_nr_in_parent_category');
  }
}

export class OptionChildPositionInParentCategory extends Option.with(ChildPositionInParentCategory) {}

export type CategoryType = {
  id: CategoryId,
  title: Text,
  description: Text,
  created_at: BlockchainTimestamp,
  deleted: Bool,
  archived: Bool,
  num_direct_subcategories: u32,
  num_direct_unmoderated_threads: u32,
  num_direct_moderated_threads: u32,
  position_in_parent_category: OptionChildPositionInParentCategory,
  moderator_id: AccountId
};

export class Category extends JoyStruct<CategoryType> {
  constructor (value: CategoryType) {
    super({
      id: CategoryId,
      title: Text,
      description: Text,
      created_at: BlockchainTimestamp,
      deleted: Bool,
      archived: Bool,
      num_direct_subcategories: u32,
      num_direct_unmoderated_threads: u32,
      num_direct_moderated_threads: u32,
      position_in_parent_category: OptionChildPositionInParentCategory,
      moderator_id: AccountId
    }, value);
  }

  get id (): CategoryId {
    return this.getRequired('id');
  }

  get title (): string {
    return getTextPropAsString(this, 'title');
  }

  get description (): string {
    return getTextPropAsString(this, 'description');
  }

  get created_at (): BlockchainTimestamp {
    return this.getRequired('created_at');
  }

  get deleted (): boolean {
    return getBoolPropAsBoolean(this, 'deleted');
  }

  get archived (): boolean {
    return getBoolPropAsBoolean(this, 'archived');
  }

  get num_direct_subcategories (): u32 {
    return this.getRequired('num_direct_subcategories');
  }

  get num_direct_unmoderated_threads (): u32 {
    return this.getRequired('num_direct_unmoderated_threads');
  }

  get num_direct_moderated_threads (): u32 {
    return this.getRequired('num_direct_moderated_threads');
  }

  get num_threads_created (): u32 {
    return new u32(this.num_direct_unmoderated_threads.add(this.num_direct_moderated_threads));
  }

  get position_in_parent_category (): OptionChildPositionInParentCategory | undefined {
    return getOptionPropOrUndefined(this, 'position_in_parent_category');
  }

  get moderator_id (): AccountId {
    return this.getRequired('moderator_id');
  }
}

export type ThreadType = {
  id: ThreadId,
  title: Text,
  category_id: CategoryId,
  nr_in_category: u32,
  moderation: OptionModerationAction,
  num_unmoderated_posts: u32,
  num_moderated_posts: u32,
  created_at: BlockchainTimestamp,
  author_id: AccountId
};

export class Thread extends JoyStruct<ThreadType> {
  constructor (value: ThreadType) {
    super({
      id: ThreadId,
      title: Text,
      category_id: CategoryId,
      nr_in_category: u32,
      moderation: OptionModerationAction,
      num_unmoderated_posts: u32,
      num_moderated_posts: u32,
      created_at: BlockchainTimestamp,
      author_id: AccountId
    }, value);
  }

  get id (): ThreadId {
    return this.getRequired('id');
  }

  get title (): string {
    return getTextPropAsString(this, 'title');
  }

  get category_id (): CategoryId {
    return this.getRequired('category_id');
  }

  get nr_in_category (): u32 {
    return this.getRequired('nr_in_category');
  }

  get moderation (): ModerationAction | undefined {
    return getOptionPropOrUndefined(this, 'moderation');
  }

  get moderated (): boolean {
    return this.moderation !== undefined;
  }

  get num_unmoderated_posts (): u32 {
    return this.getRequired('num_unmoderated_posts');
  }

  get num_moderated_posts (): u32 {
    return this.getRequired('num_moderated_posts');
  }

  get num_posts_ever_created (): u32 {
    return new u32(this.num_unmoderated_posts.add(this.num_moderated_posts));
  }

  get created_at (): BlockchainTimestamp {
    return this.getRequired('created_at');
  }

  get author_id (): AccountId {
    return this.getRequired('author_id');
  }
}

export type PostType = {
  id: PostId,
  thread_id: ThreadId,
  nr_in_thread: u32,
  current_text: Text,
  moderation: OptionModerationAction,
  text_change_history: VecPostTextChange,
  created_at: BlockchainTimestamp,
  author_id: AccountId
};

// TODO deprectated: replaced w/ Post
export class Post extends JoyStruct<PostType> {
  constructor (value: PostType) {
    super({
      id: PostId,
      thread_id: ThreadId,
      nr_in_thread: u32,
      current_text: Text,
      moderation: OptionModerationAction,
      text_change_history: VecPostTextChange,
      created_at: BlockchainTimestamp,
      author_id: AccountId
    }, value);
  }

  get id (): PostId {
    return this.getRequired('id');
  }

  get thread_id (): ThreadId {
    return this.getRequired('thread_id');
  }

  get nr_in_thread (): u32 {
    return this.getRequired('nr_in_thread');
  }

  get current_text (): string {
    return getTextPropAsString(this, 'current_text');
  }

  get moderation (): ModerationAction | undefined {
    return getOptionPropOrUndefined(this, 'moderation');
  }

  get moderated (): boolean {
    return this.moderation !== undefined;
  }

  get text_change_history (): VecPostTextChange {
    return this.getRequired('text_change_history');
  }

  get created_at (): BlockchainTimestamp {
    return this.getRequired('created_at');
  }

  get author_id (): AccountId {
    return this.getRequired('author_id');
  }
}

export type ReplyType = {
  owner: AccountId,
  thread_id: ThreadId,
  text: Text,
  moderation: OptionModerationAction
};

// TODO deprectated: replaced w/ Post
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
    return this.getRequired('owner');
  }

  get thread_id (): ThreadId {
    return this.getRequired('thread_id');
  }

  get text (): string {
    return getTextPropAsString(this, 'text');
  }

  get moderation (): ModerationAction | undefined {
    return getOptionPropOrUndefined(this, 'moderation');
  }

  get moderated (): boolean {
    return this.moderation !== undefined;
  }
}

export function registerForumTypes () {
  try {
    getTypeRegistry().register({
      BlockchainTimestamp,
      PostTextChange,
      ModerationAction,
      ChildPositionInParentCategory,
      CategoryId,
      Category,
      ThreadId,
      Thread,
      PostId,
      Post,
      ReplyId,
      Reply
    });
  } catch (err) {
    console.error('Failed to register custom types of forum module', err);
  }
}
