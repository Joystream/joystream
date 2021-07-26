import { bool, u32, u64, Option, Vec, Null, Bytes, Tuple } from '@polkadot/types'
import { Moment } from '@polkadot/types/interfaces'
import { Hash, ThreadId, PostId, JoyStructDecorated, JoyEnum, JoyBTreeMap } from './common'
import { Constructor, ITuple, RegistryTypes } from '@polkadot/types/types'

export class ForumUserId extends u64 {}
export class ModeratorId extends u64 {}
export class CategoryId extends u64 {}
export class PostReactionId extends u64 {}

export class OptionCategoryId extends Option.with(CategoryId) {}
export class VecCategoryId extends Vec.with(CategoryId) {}

export class VecThreadId extends Vec.with(ThreadId) {}
export class VecPostId extends Vec.with(PostId) {}

export class PollAlternative extends JoyStructDecorated({
  alternative_text_hash: Hash,
  vote_count: u32,
}) {}

export type IPoll = {
  description_hash: Hash
  end_time: Moment
  poll_alternatives: Vec<PollAlternative>
}

export class Poll extends JoyStructDecorated({
  description_hash: Hash,
  end_time: u64,
  poll_alternatives: Vec.with(PollAlternative),
}) {}

export class Post extends JoyStructDecorated({
  thread_id: ThreadId,
  text_hash: Hash,
  author_id: ForumUserId,
}) {}

export class Thread extends JoyStructDecorated({
  title_hash: Hash,
  category_id: CategoryId,
  author_id: ForumUserId,
  archived: bool,
  poll: Option.with(Poll),
  num_direct_posts: u32,
}) {}

export class Category extends JoyStructDecorated({
  title_hash: Hash,
  description_hash: Hash,
  archived: bool,
  num_direct_subcategories: u32,
  num_direct_threads: u32,
  num_direct_moderators: u32,
  parent_category_id: Option.with(CategoryId),
  sticky_thread_ids: Vec.with(ThreadId),
}) {}

export class PrivilegedActor extends JoyEnum({
  Lead: Null,
  Moderator: ModeratorId,
}) {}

export class PollInput extends JoyStructDecorated({
  description: Bytes,
  end_time: u64,
  poll_alternatives: Vec.with(Bytes),
}) {}

export class PostIdTuple extends ((Tuple.with([CategoryId, ThreadId, PostId]) as unknown) as Constructor<
  ITuple<[CategoryId, ThreadId, PostId]>
>) {}

export class PostsToDeleteMap extends JoyBTreeMap(PostIdTuple, bool) {}

export const forumTypes: RegistryTypes = {
  ForumUserId,
  ModeratorId,
  CategoryId,
  PostReactionId,
  Category,
  Thread,
  Post,
  PollAlternative,
  Poll,
  PrivilegedActor,
  PollInput,
  // runtime alias
  ThreadOf: Thread,
}

export default forumTypes
