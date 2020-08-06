import { bool, u32, u64, Text, Option, Vec as Vector } from '@polkadot/types'
import { BlockAndTime, ThreadId, PostId, JoyStructCustom, JoyStructDecorated } from './common'
import { RegistryTypes } from '@polkadot/types/types'
import AccountId from '@polkadot/types/generic/AccountId'

export type ModerationActionType = {
  moderated_at: BlockAndTime
  moderator_id: AccountId
  rationale: Text
}

export class ModerationAction extends JoyStructCustom({
  moderated_at: BlockAndTime,
  moderator_id: AccountId,
  rationale: Text,
})
// FIXME: Make it JoyStructDecorated compatible
{
  get moderated_at(): BlockAndTime {
    return this.getField('moderated_at')
  }

  get moderator_id(): AccountId {
    return this.getField('moderator_id')
  }

  get rationale(): string {
    return this.getString('rationale')
  }
}

export type PostTextChangeType = {
  expired_at: BlockAndTime
  text: Text
}

export class PostTextChange extends JoyStructCustom({
  expired_at: BlockAndTime,
  text: Text,
})
// FIXME: Make it JoyStructDecorated compatible
{
  get expired_at(): BlockAndTime {
    return this.getField('expired_at')
  }

  get text(): string {
    return this.getString('text')
  }
}

export class VecPostTextChange extends Vector.with(PostTextChange) {}

export class OptionModerationAction extends Option.with(ModerationAction) {}

export class CategoryId extends u64 {}
export class OptionCategoryId extends Option.with(CategoryId) {}
export class VecCategoryId extends Vector.with(CategoryId) {}

export class VecThreadId extends Vector.with(ThreadId) {}
export class VecPostId extends Vector.with(PostId) {}

// TODO deprectated: replaced w/ PostId
export class ReplyId extends u64 {}
export class VecReplyId extends Vector.with(ReplyId) {}

export type ChildPositionInParentCategoryType = {
  parent_id: CategoryId
  child_nr_in_parent_category: u32
}

export class ChildPositionInParentCategory
  extends JoyStructDecorated({
    parent_id: CategoryId,
    child_nr_in_parent_category: u32,
  })
  implements ChildPositionInParentCategoryType {}

export class OptionChildPositionInParentCategory extends Option.with(ChildPositionInParentCategory) {}

export type CategoryType = {
  id: CategoryId
  title: Text
  description: Text
  created_at: BlockAndTime
  deleted: bool
  archived: bool
  num_direct_subcategories: u32
  num_direct_unmoderated_threads: u32
  num_direct_moderated_threads: u32
  position_in_parent_category: OptionChildPositionInParentCategory
  moderator_id: AccountId
}

export class Category extends JoyStructCustom({
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
  moderator_id: AccountId,
})
// FIXME: Make it JoyStructDecorated compatible
{
  get id(): CategoryId {
    return this.getField('id')
  }

  get title(): string {
    return this.getString('title')
  }

  get description(): string {
    return this.getString('description')
  }

  get created_at(): BlockAndTime {
    return this.getField('created_at')
  }

  get deleted(): boolean {
    return this.getField('deleted').valueOf()
  }

  get archived(): boolean {
    return this.getField('archived').valueOf()
  }

  get num_direct_subcategories(): u32 {
    return this.getField('num_direct_subcategories')
  }

  get num_direct_unmoderated_threads(): u32 {
    return this.getField('num_direct_unmoderated_threads')
  }

  get num_direct_moderated_threads(): u32 {
    return this.getField('num_direct_moderated_threads')
  }

  get num_threads_created(): u32 {
    return new u32(this.registry, this.num_direct_unmoderated_threads.add(this.num_direct_moderated_threads))
  }

  get hasSubcategories(): boolean {
    return !this.num_direct_subcategories.isZero()
  }

  get hasUnmoderatedThreads(): boolean {
    return !this.num_direct_unmoderated_threads.isZero()
  }

  get position_in_parent_category(): Option<ChildPositionInParentCategory> {
    return this.getField('position_in_parent_category')
  }

  get parent_id(): CategoryId | undefined {
    const pos = this.position_in_parent_category
    return pos.isSome ? pos.unwrap().parent_id : undefined
  }

  get isRoot(): boolean {
    return this.parent_id === undefined
  }

  get nr_in_parent(): u32 | undefined {
    const pos = this.position_in_parent_category
    return pos.isSome ? pos.unwrap().child_nr_in_parent_category : undefined
  }

  get moderator_id(): AccountId {
    return this.getField('moderator_id')
  }
}

export type ThreadType = {
  id: ThreadId
  title: Text
  category_id: CategoryId
  nr_in_category: u32
  moderation: OptionModerationAction
  num_unmoderated_posts: u32
  num_moderated_posts: u32
  created_at: BlockAndTime
  author_id: AccountId
}

export class Thread extends JoyStructCustom({
  id: ThreadId,
  title: Text,
  category_id: CategoryId,
  nr_in_category: u32,
  moderation: OptionModerationAction,
  num_unmoderated_posts: u32,
  num_moderated_posts: u32,
  created_at: BlockAndTime,
  author_id: AccountId,
})
// FIXME: Make it JoyStructDecorated compatible
{
  get id(): ThreadId {
    return this.getField('id')
  }

  get title(): string {
    return this.getString('title')
  }

  get category_id(): CategoryId {
    return this.getField('category_id')
  }

  get nr_in_category(): u32 {
    return this.getField('nr_in_category')
  }

  get moderation(): ModerationAction | undefined {
    return this.getField('moderation').unwrapOr(undefined)
  }

  get moderated(): boolean {
    return this.moderation !== undefined
  }

  get num_unmoderated_posts(): u32 {
    return this.getField('num_unmoderated_posts')
  }

  get num_moderated_posts(): u32 {
    return this.getField('num_moderated_posts')
  }

  get num_posts_ever_created(): u32 {
    return new u32(this.registry, this.num_unmoderated_posts.add(this.num_moderated_posts))
  }

  get created_at(): BlockAndTime {
    return this.getField('created_at')
  }

  get author_id(): AccountId {
    return this.getField('author_id')
  }
}

export type PostType = {
  id: PostId
  thread_id: ThreadId
  nr_in_thread: u32
  current_text: Text
  moderation: OptionModerationAction
  text_change_history: VecPostTextChange
  created_at: BlockAndTime
  author_id: AccountId
}

// TODO deprectated: replaced w/ Post
export class Post extends JoyStructCustom({
  id: PostId,
  thread_id: ThreadId,
  nr_in_thread: u32,
  current_text: Text,
  moderation: OptionModerationAction,
  text_change_history: VecPostTextChange,
  created_at: BlockAndTime,
  author_id: AccountId,
})
// FIXME: Make it JoyStructDecorated compatible
{
  get id(): PostId {
    return this.getField('id')
  }

  get thread_id(): ThreadId {
    return this.getField('thread_id')
  }

  get nr_in_thread(): u32 {
    return this.getField('nr_in_thread')
  }

  get current_text(): string {
    return this.getString('current_text')
  }

  get moderation(): ModerationAction | undefined {
    return this.getField('moderation').unwrapOr(undefined)
  }

  get moderated(): boolean {
    return this.moderation !== undefined
  }

  get text_change_history(): VecPostTextChange {
    return this.getField('text_change_history')
  }

  get created_at(): BlockAndTime {
    return this.getField('created_at')
  }

  get author_id(): AccountId {
    return this.getField('author_id')
  }
}

export type ReplyType = {
  owner: AccountId
  thread_id: ThreadId
  text: Text
  moderation: OptionModerationAction
}

// TODO deprectated: replaced w/ Post
export class Reply extends JoyStructCustom({
  owner: AccountId,
  thread_id: ThreadId,
  text: Text,
  moderation: OptionModerationAction,
})
// FIXME: Make it JoyStructDecorated compatible
{
  get owner(): AccountId {
    return this.getField('owner')
  }

  get thread_id(): ThreadId {
    return this.getField('thread_id')
  }

  get text(): string {
    return this.getString('text')
  }

  get moderation(): ModerationAction | undefined {
    return this.getField('moderation').unwrapOr(undefined)
  }

  get moderated(): boolean {
    return this.moderation !== undefined
  }
}

export const forumTypes: RegistryTypes = {
  PostTextChange,
  ModerationAction,
  ChildPositionInParentCategory,
  CategoryId,
  Category,
  Thread,
  Post,
  ReplyId,
  Reply,
}

export default forumTypes
