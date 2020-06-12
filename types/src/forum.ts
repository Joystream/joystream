import { getTypeRegistry, bool, u16, u32, u64, Text, Option, Vec as Vector} from '@polkadot/types';
import { AccountId } from '@polkadot/types/interfaces';
import { GenericAccountId } from '@polkadot/types';
import { BlockAndTime } from './media';

import { JoyStruct } from './JoyStruct';

export type ModerationActionType = {
  moderated_at: BlockAndTime,
  moderator_id: AccountId,
  rationale: Text
};

export class ModerationAction extends JoyStruct<ModerationActionType> {
  constructor (value: ModerationActionType) {
    super({
      moderated_at: BlockAndTime,
      moderator_id: GenericAccountId,
      rationale: Text
    }, value);
  }

  get moderated_at (): BlockAndTime {
    return this.getField('moderated_at');
  }

  get moderator_id (): AccountId {
    return this.getField('moderator_id');
  }

  get rationale (): string {
    return this.getString('rationale');
  }
}

export type PostTextChangeType = {
  expired_at: BlockAndTime,
  text: Text
};

export class PostTextChange extends JoyStruct<PostTextChangeType> {
  constructor (value: PostTextChangeType) {
    super({
      expired_at: BlockAndTime,
      text: Text
    }, value);
  }

  get expired_at (): BlockAndTime {
    return this.getField('expired_at');
  }

  get text (): string {
    return this.getString('text');
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

export type InputValidationLengthConstraintType = {
  min: u16,
  max_min_diff: u16
};

export class InputValidationLengthConstraint extends JoyStruct<InputValidationLengthConstraintType> {
  constructor (value: InputValidationLengthConstraintType) {
    super({
      min: u16,
      max_min_diff: u16
    }, value);
  }

  get min (): u16 {
    return this.getField('min');
  }

  get max_min_diff (): u16 {
    return this.getField('max_min_diff');
  }

  get max (): u16 {
    return new u16(this.min.add(this.max_min_diff));
  }
}

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
    return this.getField('parent_id');
  }

  get child_nr_in_parent_category (): u32 {
    return this.getField('child_nr_in_parent_category');
  }
}

export class OptionChildPositionInParentCategory extends Option.with(ChildPositionInParentCategory) {}

export type CategoryType = {
  id: CategoryId,
  title: Text,
  description: Text,
  created_at: BlockAndTime,
  deleted: bool,
  archived: bool,
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
      created_at: BlockAndTime,
      deleted: bool,
      archived: bool,
      num_direct_subcategories: u32,
      num_direct_unmoderated_threads: u32,
      num_direct_moderated_threads: u32,
      position_in_parent_category: OptionChildPositionInParentCategory,
      moderator_id: GenericAccountId
    }, value);
  }

  static newEmpty (): Category {
    return new Category({} as CategoryType);
  }

  get id (): CategoryId {
    return this.getField('id');
  }

  get title (): string {
    return this.getString('title');
  }

  get description (): string {
    return this.getString('description');
  }

  get created_at (): BlockAndTime {
    return this.getField('created_at');
  }

  get deleted (): boolean {
    return this.getBoolean('deleted');
  }

  get archived (): boolean {
    return this.getBoolean('archived');
  }

  get num_direct_subcategories (): u32 {
    return this.getField('num_direct_subcategories');
  }

  get num_direct_unmoderated_threads (): u32 {
    return this.getField('num_direct_unmoderated_threads');
  }

  get num_direct_moderated_threads (): u32 {
    return this.getField('num_direct_moderated_threads');
  }

  get num_threads_created (): u32 {
    return new u32(this.num_direct_unmoderated_threads.add(this.num_direct_moderated_threads));
  }

  get hasSubcategories (): boolean {
    return !this.num_direct_subcategories.isZero();
  }

  get hasUnmoderatedThreads (): boolean {
    return !this.num_direct_unmoderated_threads.isZero();
  }

  get position_in_parent_category (): Option<ChildPositionInParentCategory> {
    return this.getField('position_in_parent_category');
  }

  get parent_id (): CategoryId | undefined {
    const pos = this.position_in_parent_category;
    return pos.isSome ? pos.unwrap().parent_id : undefined;
  }

  get isRoot (): boolean {
    return this.parent_id === undefined;
  }

  get nr_in_parent (): u32 | undefined {
    const pos = this.position_in_parent_category;
    return pos.isSome ? pos.unwrap().child_nr_in_parent_category : undefined;
  }

  get moderator_id (): AccountId {
    return this.getField('moderator_id');
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
  created_at: BlockAndTime,
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
      created_at: BlockAndTime,
      author_id: GenericAccountId
    }, value);
  }

  static newEmpty (): Thread {
    return new Thread({} as ThreadType);
  }

  get id (): ThreadId {
    return this.getField('id');
  }

  get title (): string {
    return this.getString('title');
  }

  get category_id (): CategoryId {
    return this.getField('category_id');
  }

  get nr_in_category (): u32 {
    return this.getField('nr_in_category');
  }

  get moderation (): ModerationAction | undefined {
    return this.unwrapOrUndefined('moderation');
  }

  get moderated (): boolean {
    return this.moderation !== undefined;
  }

  get num_unmoderated_posts (): u32 {
    return this.getField('num_unmoderated_posts');
  }

  get num_moderated_posts (): u32 {
    return this.getField('num_moderated_posts');
  }

  get num_posts_ever_created (): u32 {
    return new u32(this.num_unmoderated_posts.add(this.num_moderated_posts));
  }

  get created_at (): BlockAndTime {
    return this.getField('created_at');
  }

  get author_id (): AccountId {
    return this.getField('author_id');
  }
}

export type PostType = {
  id: PostId,
  thread_id: ThreadId,
  nr_in_thread: u32,
  current_text: Text,
  moderation: OptionModerationAction,
  text_change_history: VecPostTextChange,
  created_at: BlockAndTime,
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
      created_at: BlockAndTime,
      author_id: GenericAccountId
    }, value);
  }

  static newEmpty (): Post {
    return new Post({} as PostType);
  }

  get id (): PostId {
    return this.getField('id');
  }

  get thread_id (): ThreadId {
    return this.getField('thread_id');
  }

  get nr_in_thread (): u32 {
    return this.getField('nr_in_thread');
  }

  get current_text (): string {
    return this.getString('current_text');
  }

  get moderation (): ModerationAction | undefined {
    return this.unwrapOrUndefined('moderation');
  }

  get moderated (): boolean {
    return this.moderation !== undefined;
  }

  get text_change_history (): VecPostTextChange {
    return this.getField('text_change_history');
  }

  get created_at (): BlockAndTime {
    return this.getField('created_at');
  }

  get author_id (): AccountId {
    return this.getField('author_id');
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
      owner: GenericAccountId,
      thread_id: ThreadId,
      text: Text,
      moderation: OptionModerationAction
    }, value);
  }

  get owner (): AccountId {
    return this.getField('owner');
  }

  get thread_id (): ThreadId {
    return this.getField('thread_id');
  }

  get text (): string {
    return this.getString('text');
  }

  get moderation (): ModerationAction | undefined {
    return this.unwrapOrUndefined('moderation');
  }

  get moderated (): boolean {
    return this.moderation !== undefined;
  }
}

export function registerForumTypes () {
  try {
    getTypeRegistry().register({
      PostTextChange,
      ModerationAction,
      InputValidationLengthConstraint,
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
