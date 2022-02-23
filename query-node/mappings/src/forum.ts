/*
eslint-disable @typescript-eslint/naming-convention
*/
import { EventContext, StoreContext, DatabaseManager } from '@joystream/hydra-common'
import {
  bytesToString,
  deserializeMetadata,
  genericEventFields,
  getWorker,
  inconsistentState,
  perpareString,
  toNumber,
} from './common'
import {
  CategoryCreatedEvent,
  CategoryStatusActive,
  CategoryArchivalStatusUpdatedEvent,
  ForumCategory,
  Worker,
  CategoryStatusArchived,
  CategoryDeletedEvent,
  CategoryStatusRemoved,
  ThreadCreatedEvent,
  ForumThread,
  Membership,
  ThreadStatusActive,
  ForumPoll,
  ForumPollAlternative,
  ThreadModeratedEvent,
  ThreadStatusModerated,
  ThreadMetadataUpdatedEvent,
  ThreadDeletedEvent,
  ThreadStatusLocked,
  ThreadStatusRemoved,
  ThreadMovedEvent,
  ForumPost,
  PostStatusActive,
  PostOriginThreadInitial,
  VoteOnPollEvent,
  PostAddedEvent,
  PostStatusLocked,
  PostOriginThreadReply,
  CategoryStickyThreadUpdateEvent,
  CategoryMembershipOfModeratorUpdatedEvent,
  PostModeratedEvent,
  PostStatusModerated,
  ForumPostReaction,
  PostReaction,
  PostReactedEvent,
  PostReactionResult,
  PostReactionResultCancel,
  PostReactionResultValid,
  PostReactionResultInvalid,
  PostTextUpdatedEvent,
  PostDeletedEvent,
  PostStatusRemoved,
  ForumThreadTag,
} from 'query-node/dist/model'
import { Forum } from '../generated/types'
import { PostReactionId, PrivilegedActor } from '@joystream/types/augment/all'
import {
  ForumPostMetadata,
  ForumPostReaction as SupportedPostReactions,
  ForumThreadMetadata,
} from '@joystream/metadata-protobuf'
import { isSet } from '@joystream/metadata-protobuf/utils'
import { MAX_TAGS_PER_FORUM_THREAD } from '@joystream/metadata-protobuf/consts'
import { Not, In } from 'typeorm'
import { Bytes } from '@polkadot/types'
import _ from 'lodash'
import BN from 'bn.js'

async function getCategory(store: DatabaseManager, categoryId: string, relations?: string[]): Promise<ForumCategory> {
  const category = await store.get(ForumCategory, { where: { id: categoryId }, relations })
  if (!category) {
    throw new Error(`Forum category not found by id: ${categoryId}`)
  }

  return category
}

async function getThread(store: DatabaseManager, threadId: string): Promise<ForumThread> {
  const thread = await store.get(ForumThread, { where: { id: threadId } })
  if (!thread) {
    throw new Error(`Forum thread not found by id: ${threadId.toString()}`)
  }

  return thread
}

async function getPost(store: DatabaseManager, postId: string, relations?: 'thread'[]): Promise<ForumPost> {
  const post = await store.get(ForumPost, { where: { id: postId }, relations })
  if (!post) {
    throw new Error(`Forum post not found by id: ${postId.toString()}`)
  }

  return post
}

async function getPollAlternative(store: DatabaseManager, threadId: string, index: number) {
  const poll = await store.get(ForumPoll, { where: { thread: { id: threadId } }, relations: ['pollAlternatives'] })
  if (!poll) {
    throw new Error(`Forum poll not found by threadId: ${threadId.toString()}`)
  }
  const pollAlternative = poll.pollAlternatives?.find((alt) => alt.index === index)
  if (!pollAlternative) {
    throw new Error(`Froum poll alternative not found by index ${index} in thread ${threadId.toString()}`)
  }

  return pollAlternative
}

async function getActorWorker(store: DatabaseManager, actor: PrivilegedActor): Promise<Worker> {
  const worker = await store.get(Worker, {
    where: {
      group: { id: 'forumWorkingGroup' },
      ...(actor.isLead ? { isLead: true } : { runtimeId: actor.asModerator.toNumber() }),
    },
    relations: ['group'],
  })

  if (!worker) {
    throw new Error(`Corresponding worker not found by forum PrivielagedActor: ${JSON.stringify(actor.toHuman())}`)
  }

  return worker
}

function normalizeForumTagLabel(label: string): string {
  // Optionally: normalize to lowercase & ASCII only?
  return perpareString(label)
}

function parseThreadMetadata(metaBytes: Bytes) {
  const meta = deserializeMetadata(ForumThreadMetadata, metaBytes)
  return {
    title: meta ? meta.title : bytesToString(metaBytes),
    tags:
      meta && isSet(meta.tags)
        ? _.uniq(meta.tags.slice(0, MAX_TAGS_PER_FORUM_THREAD).map((label) => normalizeForumTagLabel(label))).filter(
            (v) => v // Filter out empty strings
          )
        : undefined,
  }
}

async function prepareThreadTagsToSet(
  { event, store }: StoreContext & EventContext,
  labels: string[]
): Promise<ForumThreadTag[]> {
  const eventTime = new Date(event.blockTimestamp)
  return Promise.all(
    labels.map(async (label) => {
      const forumTag =
        (await store.get(ForumThreadTag, { where: { id: label } })) ||
        new ForumThreadTag({
          id: label,
          createdAt: eventTime,
          visibleThreadsCount: 0,
        })
      forumTag.updatedAt = eventTime
      ++forumTag.visibleThreadsCount
      await store.save<ForumThreadTag>(forumTag)
      return forumTag
    })
  )
}

async function unsetThreadTags({ event, store }: StoreContext & EventContext, tags: ForumThreadTag[]): Promise<void> {
  const eventTime = new Date(event.blockTimestamp)
  await Promise.all(
    tags.map(async (forumTag) => {
      --forumTag.visibleThreadsCount
      if (forumTag.visibleThreadsCount < 0) {
        inconsistentState('Trying to update forumTag.visibleThreadsCount to a number below 0!')
      }
      forumTag.updatedAt = eventTime
      await store.save<ForumThreadTag>(forumTag)
    })
  )
}

// Get standarized PostReactionResult by PostReactionId
function parseReaction(reactionId: PostReactionId): typeof PostReactionResult {
  switch (toNumber(reactionId)) {
    case SupportedPostReactions.Reaction.CANCEL: {
      return new PostReactionResultCancel()
    }
    case SupportedPostReactions.Reaction.LIKE: {
      const result = new PostReactionResultValid()
      result.reaction = PostReaction.LIKE
      result.reactionId = reactionId.toNumber()
      return result
    }
    default: {
      console.warn(`Invalid post reaction id: ${reactionId.toString()}`)
      const result = new PostReactionResultInvalid()
      result.reactionId = reactionId.toString()
      return result
    }
  }
}

export async function forum_CategoryCreated({ event, store }: EventContext & StoreContext): Promise<void> {
  const [categoryId, parentCategoryId, titleBytes, descriptionBytes] = new Forum.CategoryCreatedEvent(event).params
  const eventTime = new Date(event.blockTimestamp)

  const category = new ForumCategory({
    id: categoryId.toString(),
    createdAt: eventTime,
    updatedAt: eventTime,
    title: bytesToString(titleBytes),
    description: bytesToString(descriptionBytes),
    status: new CategoryStatusActive(),
    parent: parentCategoryId.isSome ? new ForumCategory({ id: parentCategoryId.unwrap().toString() }) : undefined,
  })

  await store.save<ForumCategory>(category)

  const categoryCreatedEvent = new CategoryCreatedEvent({
    ...genericEventFields(event),
    category,
  })
  await store.save<CategoryCreatedEvent>(categoryCreatedEvent)
}

export async function forum_CategoryArchivalStatusUpdated({
  event,
  store,
}: EventContext & StoreContext): Promise<void> {
  const [categoryId, newArchivalStatus, privilegedActor] = new Forum.CategoryArchivalStatusUpdatedEvent(event).params
  const eventTime = new Date(event.blockTimestamp)
  const category = await getCategory(store, categoryId.toString())
  const actorWorker = await getActorWorker(store, privilegedActor)

  const categoryArchivalStatusUpdatedEvent = new CategoryArchivalStatusUpdatedEvent({
    ...genericEventFields(event),
    category,
    newArchivalStatus: newArchivalStatus.valueOf(),
    actor: actorWorker,
  })
  await store.save<CategoryArchivalStatusUpdatedEvent>(categoryArchivalStatusUpdatedEvent)

  if (newArchivalStatus.valueOf()) {
    const status = new CategoryStatusArchived()
    status.categoryArchivalStatusUpdatedEventId = categoryArchivalStatusUpdatedEvent.id
    category.status = status
  } else {
    category.status = new CategoryStatusActive()
  }
  category.updatedAt = eventTime
  await store.save<ForumCategory>(category)
}

export async function forum_CategoryDeleted({ event, store }: EventContext & StoreContext): Promise<void> {
  const [categoryId, privilegedActor] = new Forum.CategoryDeletedEvent(event).params
  const eventTime = new Date(event.blockTimestamp)
  const category = await getCategory(store, categoryId.toString())
  const actorWorker = await getActorWorker(store, privilegedActor)

  const categoryDeletedEvent = new CategoryDeletedEvent({
    ...genericEventFields(event),
    category,
    actor: actorWorker,
  })
  await store.save<CategoryDeletedEvent>(categoryDeletedEvent)

  const newStatus = new CategoryStatusRemoved()
  newStatus.categoryDeletedEventId = categoryDeletedEvent.id

  category.updatedAt = eventTime
  category.status = newStatus
  await store.save<ForumCategory>(category)
}

export async function forum_ThreadCreated(ctx: EventContext & StoreContext): Promise<void> {
  const { event, store } = ctx
  const [
    categoryId,
    threadId,
    postId,
    memberId,
    threadMetaBytes,
    postTextBytes,
    pollInput,
  ] = new Forum.ThreadCreatedEvent(event).params
  const eventTime = new Date(event.blockTimestamp)
  const author = new Membership({ id: memberId.toString() })

  const { title, tags } = parseThreadMetadata(threadMetaBytes)

  const thread = new ForumThread({
    createdAt: eventTime,
    updatedAt: eventTime,
    id: threadId.toString(),
    author,
    category: new ForumCategory({ id: categoryId.toString() }),
    title: title || '',
    isSticky: false,
    status: new ThreadStatusActive(),
    isVisible: true,
    visiblePostsCount: 1,
    tags: tags ? await prepareThreadTagsToSet(ctx, tags) : [],
  })
  await store.save<ForumThread>(thread)

  if (pollInput.isSome) {
    const threadPoll = new ForumPoll({
      createdAt: eventTime,
      updatedAt: eventTime,
      description: bytesToString(pollInput.unwrap().description),
      endTime: new Date(toNumber(pollInput.unwrap().end_time, new Date('3000-01-01').getTime())),
      thread,
    })
    await store.save<ForumPoll>(threadPoll)
    await Promise.all(
      pollInput.unwrap().poll_alternatives.map(async (alt, index) => {
        const alternative = new ForumPollAlternative({
          createdAt: eventTime,
          updatedAt: eventTime,
          poll: threadPoll,
          text: bytesToString(alt),
          index,
        })

        await store.save<ForumPollAlternative>(alternative)
      })
    )
  }

  const threadCreatedEvent = new ThreadCreatedEvent({
    ...genericEventFields(event),
    thread,
    title: title || '',
    text: bytesToString(postTextBytes),
  })
  await store.save<ThreadCreatedEvent>(threadCreatedEvent)

  const postOrigin = new PostOriginThreadInitial()
  postOrigin.threadCreatedEventId = threadCreatedEvent.id

  const initialPost = new ForumPost({
    id: postId.toString(),
    createdAt: eventTime,
    updatedAt: eventTime,
    author,
    thread,
    text: bytesToString(postTextBytes),
    status: new PostStatusActive(),
    isVisible: true,
    origin: postOrigin,
  })
  await store.save<ForumPost>(initialPost)

  thread.initialPost = initialPost
  await store.save<ForumThread>(thread)
}

export async function forum_ThreadModerated(ctx: EventContext & StoreContext): Promise<void> {
  const { event, store } = ctx
  const [threadId, rationaleBytes, privilegedActor] = new Forum.ThreadModeratedEvent(event).params
  const eventTime = new Date(event.blockTimestamp)
  const actorWorker = await getActorWorker(store, privilegedActor)
  const thread = await getThread(store, threadId.toString())

  const threadModeratedEvent = new ThreadModeratedEvent({
    ...genericEventFields(event),
    actor: actorWorker,
    thread,
    rationale: bytesToString(rationaleBytes),
  })

  await store.save<ThreadModeratedEvent>(threadModeratedEvent)

  const newStatus = new ThreadStatusModerated()
  newStatus.threadModeratedEventId = threadModeratedEvent.id

  thread.updatedAt = eventTime
  thread.status = newStatus
  thread.isVisible = false
  thread.visiblePostsCount = 0
  await unsetThreadTags(ctx, thread.tags || [])
  await store.save<ForumThread>(thread)
}

export async function forum_ThreadMetadataUpdated(ctx: EventContext & StoreContext): Promise<void> {
  const { event, store } = ctx
  const [threadId, , , newMetadataBytes] = new Forum.ThreadMetadataUpdatedEvent(event).params
  const eventTime = new Date(event.blockTimestamp)
  const thread = await getThread(store, threadId.toString())

  const { title: newTitle, tags: newTagIds } = parseThreadMetadata(newMetadataBytes)

  // Only update tags if set
  if (isSet(newTagIds)) {
    const currentTagIds = (thread.tags || []).map((t) => t.id)
    const tagIdsToSet = _.difference(newTagIds, currentTagIds)
    const tagIdsToUnset = _.difference(currentTagIds, newTagIds)
    const newTags = await prepareThreadTagsToSet(ctx, tagIdsToSet)
    await unsetThreadTags(
      ctx,
      (thread.tags || []).filter((t) => tagIdsToUnset.includes(t.id))
    )
    thread.tags = newTags
  }

  if (isSet(newTitle)) {
    thread.title = newTitle
  }

  thread.updatedAt = eventTime
  await store.save<ForumThread>(thread)

  const threadMetadataUpdatedEvent = new ThreadMetadataUpdatedEvent({
    ...genericEventFields(event),
    thread,
    newTitle: newTitle || undefined,
  })

  await store.save<ThreadMetadataUpdatedEvent>(threadMetadataUpdatedEvent)
}

export async function forum_ThreadDeleted(ctx: EventContext & StoreContext): Promise<void> {
  const { event, store } = ctx
  const [threadId, , , hide] = new Forum.ThreadDeletedEvent(event).params
  const eventTime = new Date(event.blockTimestamp)
  const thread = await getThread(store, threadId.toString())

  const threadDeletedEvent = new ThreadDeletedEvent({
    ...genericEventFields(event),
    thread,
  })

  await store.save<ThreadDeletedEvent>(threadDeletedEvent)

  const status = hide.isTrue ? new ThreadStatusRemoved() : new ThreadStatusLocked()
  status.threadDeletedEventId = threadDeletedEvent.id
  thread.status = status
  thread.updatedAt = eventTime
  if (hide.isTrue) {
    thread.isVisible = false
    thread.visiblePostsCount = 0
    await unsetThreadTags(ctx, thread.tags || [])
  }
  await store.save<ForumThread>(thread)
}

export async function forum_ThreadMoved({ event, store }: EventContext & StoreContext): Promise<void> {
  const [threadId, newCategoryId, privilegedActor, oldCategoryId] = new Forum.ThreadMovedEvent(event).params
  const eventTime = new Date(event.blockTimestamp)
  const thread = await getThread(store, threadId.toString())
  const actorWorker = await getActorWorker(store, privilegedActor)

  const threadMovedEvent = new ThreadMovedEvent({
    ...genericEventFields(event),
    thread,
    oldCategory: new ForumCategory({ id: oldCategoryId.toString() }),
    newCategory: new ForumCategory({ id: newCategoryId.toString() }),
    actor: actorWorker,
  })

  await store.save<ThreadMovedEvent>(threadMovedEvent)

  thread.updatedAt = eventTime
  thread.category = new ForumCategory({ id: newCategoryId.toString() })
  await store.save<ForumThread>(thread)
}

export async function forum_VoteOnPoll({ event, store }: EventContext & StoreContext): Promise<void> {
  const [threadId, alternativeIndex, forumUserId] = new Forum.VoteOnPollEvent(event).params
  const pollAlternative = await getPollAlternative(store, threadId.toString(), alternativeIndex.toNumber())
  const votingMember = new Membership({ id: forumUserId.toString() })

  const voteOnPollEvent = new VoteOnPollEvent({
    ...genericEventFields(event),
    pollAlternative,
    votingMember,
  })

  await store.save<VoteOnPollEvent>(voteOnPollEvent)
}

export async function forum_PostAdded({ event, store }: EventContext & StoreContext): Promise<void> {
  const [postId, forumUserId, , threadId, metadataBytes, isEditable] = new Forum.PostAddedEvent(event).params
  const eventTime = new Date(event.blockTimestamp)

  const thread = await getThread(store, threadId.toString())
  const metadata = deserializeMetadata(ForumPostMetadata, metadataBytes)
  const postText = metadata ? metadata.text || '' : bytesToString(metadataBytes)
  const repliesToPost =
    typeof metadata?.repliesTo === 'number' &&
    (await store.get(ForumPost, { where: { id: metadata.repliesTo.toString() } }))

  const postStatus = isEditable.valueOf() ? new PostStatusActive() : new PostStatusLocked()
  const postOrigin = new PostOriginThreadReply()

  const post = new ForumPost({
    id: postId.toString(),
    createdAt: eventTime,
    updatedAt: eventTime,
    text: postText,
    thread,
    status: postStatus,
    isVisible: true,
    author: new Membership({ id: forumUserId.toString() }),
    origin: postOrigin,
    repliesTo: repliesToPost || undefined,
  })
  await store.save<ForumPost>(post)

  const postAddedEvent = new PostAddedEvent({
    ...genericEventFields(event),
    post,
    isEditable: isEditable.valueOf(),
    text: postText,
  })

  await store.save<PostAddedEvent>(postAddedEvent)
  // Update the other side of cross-relationship
  postOrigin.postAddedEventId = postAddedEvent.id
  await store.save<ForumPost>(post)

  ++thread.visiblePostsCount
  thread.updatedAt = eventTime
  await store.save<ForumThread>(thread)
}

export async function forum_CategoryStickyThreadUpdate({ event, store }: EventContext & StoreContext): Promise<void> {
  const [categoryId, newStickyThreadsIdsVec, privilegedActor] = new Forum.CategoryStickyThreadUpdateEvent(event).params
  const eventTime = new Date(event.blockTimestamp)
  const actorWorker = await getActorWorker(store, privilegedActor)
  const newStickyThreadsIds = newStickyThreadsIdsVec.map((id) => id.toString())
  const threadsToSetSticky = await store.getMany(ForumThread, {
    where: { category: { id: categoryId.toString() }, id: In(newStickyThreadsIds) },
  })
  const threadsToUnsetSticky = await store.getMany(ForumThread, {
    where: { category: { id: categoryId.toString() }, isSticky: true, id: Not(In(newStickyThreadsIds)) },
  })

  const setStickyUpdates = (threadsToSetSticky || []).map(async (t) => {
    t.updatedAt = eventTime
    t.isSticky = true
    await store.save<ForumThread>(t)
  })

  const unsetStickyUpdates = (threadsToUnsetSticky || []).map(async (t) => {
    t.updatedAt = eventTime
    t.isSticky = false
    await store.save<ForumThread>(t)
  })

  await Promise.all(setStickyUpdates.concat(unsetStickyUpdates))

  const categoryStickyThreadUpdateEvent = new CategoryStickyThreadUpdateEvent({
    ...genericEventFields(event),
    actor: actorWorker,
    category: new ForumCategory({ id: categoryId.toString() }),
    newStickyThreads: threadsToSetSticky,
  })

  await store.save<CategoryStickyThreadUpdateEvent>(categoryStickyThreadUpdateEvent)
}

export async function forum_CategoryMembershipOfModeratorUpdated({
  store,
  event,
}: EventContext & StoreContext): Promise<void> {
  const [moderatorId, categoryId, canModerate] = new Forum.CategoryMembershipOfModeratorUpdatedEvent(event).params
  const eventTime = new Date(event.blockTimestamp)
  const moderator = await getWorker(store, 'forumWorkingGroup', moderatorId.toNumber())
  const category = await getCategory(store, categoryId.toString(), ['moderators'])

  if (canModerate.valueOf()) {
    category.moderators.push(moderator)
    category.updatedAt = eventTime
    await store.save<ForumCategory>(category)
  } else {
    category.moderators.splice(category.moderators.map((m) => m.id).indexOf(moderator.id), 1)
    category.updatedAt = eventTime
    await store.save<ForumCategory>(category)
  }

  const categoryMembershipOfModeratorUpdatedEvent = new CategoryMembershipOfModeratorUpdatedEvent({
    ...genericEventFields(event),
    category,
    moderator,
    newCanModerateValue: canModerate.valueOf(),
  })
  await store.save<CategoryMembershipOfModeratorUpdatedEvent>(categoryMembershipOfModeratorUpdatedEvent)
}

export async function forum_PostModerated({ event, store }: EventContext & StoreContext): Promise<void> {
  const [postId, rationaleBytes, privilegedActor] = new Forum.PostModeratedEvent(event).params
  const eventTime = new Date(event.blockTimestamp)
  const actorWorker = await getActorWorker(store, privilegedActor)
  const post = await getPost(store, postId.toString(), ['thread'])

  const postModeratedEvent = new PostModeratedEvent({
    ...genericEventFields(event),
    actor: actorWorker,
    post,
    rationale: bytesToString(rationaleBytes),
  })

  await store.save<PostModeratedEvent>(postModeratedEvent)

  const newStatus = new PostStatusModerated()
  newStatus.postModeratedEventId = postModeratedEvent.id

  post.updatedAt = eventTime
  post.status = newStatus
  post.isVisible = false
  await store.save<ForumPost>(post)

  const { thread } = post
  --thread.visiblePostsCount
  thread.updatedAt = eventTime
  await store.save<ForumThread>(thread)
}

export async function forum_PostReacted({ event, store }: EventContext & StoreContext): Promise<void> {
  const [userId, postId, reactionId] = new Forum.PostReactedEvent(event).params
  const eventTime = new Date(event.blockTimestamp)

  const reactionResult = parseReaction(reactionId)
  const postReactedEvent = new PostReactedEvent({
    ...genericEventFields(event),
    post: new ForumPost({ id: postId.toString() }),
    reactingMember: new Membership({ id: userId.toString() }),
    reactionResult,
  })
  await store.save<PostReactedEvent>(postReactedEvent)

  const existingUserPostReaction = await store.get(ForumPostReaction, {
    where: { post: { id: postId.toString() }, member: { id: userId.toString() } },
  })

  if (reactionResult.isTypeOf === 'PostReactionResultValid') {
    const { reaction } = reactionResult as PostReactionResultValid

    if (existingUserPostReaction) {
      existingUserPostReaction.updatedAt = eventTime
      existingUserPostReaction.reaction = reaction
      await store.save<ForumPostReaction>(existingUserPostReaction)
    } else {
      const newUserPostReaction = new ForumPostReaction({
        createdAt: eventTime,
        updatedAt: eventTime,
        post: new ForumPost({ id: postId.toString() }),
        member: new Membership({ id: userId.toString() }),
        reaction,
      })
      await store.save<ForumPostReaction>(newUserPostReaction)
    }
  } else if (existingUserPostReaction) {
    await store.remove<ForumPostReaction>(existingUserPostReaction)
  }
}

export async function forum_PostTextUpdated({ event, store }: EventContext & StoreContext): Promise<void> {
  const [postId, , , , newTextBytes] = new Forum.PostTextUpdatedEvent(event).params
  const eventTime = new Date(event.blockTimestamp)
  const post = await getPost(store, postId.toString())

  const postTextUpdatedEvent = new PostTextUpdatedEvent({
    ...genericEventFields(event),
    post,
    newText: bytesToString(newTextBytes),
  })

  await store.save<PostTextUpdatedEvent>(postTextUpdatedEvent)

  post.updatedAt = eventTime
  post.text = bytesToString(newTextBytes)
  await store.save<ForumPost>(post)
}

export async function forum_PostDeleted({ event, store }: EventContext & StoreContext): Promise<void> {
  const [rationaleBytes, userId, postsData] = new Forum.PostDeletedEvent(event).params
  const eventTime = new Date(event.blockTimestamp)

  const postDeletedEvent = new PostDeletedEvent({
    ...genericEventFields(event),
    actor: new Membership({ id: userId.toString() }),
    rationale: bytesToString(rationaleBytes),
  })

  await store.save<PostDeletedEvent>(postDeletedEvent)

  await Promise.all(
    Array.from(postsData.entries()).map(async ([{ post_id: postId }, hideFlag]) => {
      const post = await getPost(store, postId.toString(), ['thread'])
      const newStatus = hideFlag.isTrue ? new PostStatusRemoved() : new PostStatusLocked()
      newStatus.postDeletedEventId = postDeletedEvent.id
      post.updatedAt = eventTime
      post.status = newStatus
      post.deletedInEvent = postDeletedEvent
      post.isVisible = hideFlag.isFalse
      await store.save<ForumPost>(post)

      if (hideFlag.isTrue) {
        const { thread } = post
        --thread.visiblePostsCount
        thread.updatedAt = eventTime
        await store.save<ForumThread>(thread)
      }
    })
  )
}
