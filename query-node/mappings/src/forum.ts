/*
eslint-disable @typescript-eslint/naming-convention
*/
import { DatabaseManager, EventContext, StoreContext, SubstrateEvent } from '@joystream/hydra-common'
import { ForumPostMetadata, ForumThreadMetadata } from '@joystream/metadata-protobuf'
import { MAX_TAGS_PER_FORUM_THREAD } from '@joystream/metadata-protobuf/consts'
import { isSet } from '@joystream/metadata-protobuf/utils'
import { Bytes } from '@polkadot/types'
import { PalletForumPrivilegedActor as PrivilegedActor } from '@polkadot/types/lookup'
import _ from 'lodash'
import {
  CategoryArchivalStatusUpdatedEvent,
  CategoryCreatedEvent,
  CategoryDeletedEvent,
  CategoryMembershipOfModeratorUpdatedEvent,
  CategoryStatusActive,
  CategoryStatusArchived,
  CategoryStatusRemoved,
  CategoryStickyThreadUpdateEvent,
  ForumCategory,
  ForumPost,
  ForumThread,
  ForumThreadTag,
  Membership,
  PostAddedEvent,
  PostDeletedEvent,
  PostModeratedEvent,
  PostOriginThreadInitial,
  PostOriginThreadReply,
  PostStatusActive,
  PostStatusLocked,
  PostStatusModerated,
  PostStatusRemoved,
  PostTextUpdatedEvent,
  ThreadCreatedEvent,
  ThreadDeletedEvent,
  ThreadMetadataUpdatedEvent,
  ThreadModeratedEvent,
  ThreadMovedEvent,
  ThreadStatusActive,
  ThreadStatusLocked,
  ThreadStatusModerated,
  ThreadStatusRemoved,
  Worker,
} from 'query-node/dist/model'
import { In, Not } from 'typeorm'
import {
  Forum_CategoryArchivalStatusUpdatedEvent_V1001 as CategoryArchivalStatusUpdatedEvent_V1001,
  Forum_CategoryCreatedEvent_V1001 as CategoryCreatedEvent_V1001,
  Forum_CategoryDeletedEvent_V1001 as CategoryDeletedEvent_V1001,
  Forum_CategoryMembershipOfModeratorUpdatedEvent_V1001 as CategoryMembershipOfModeratorUpdatedEvent_V1001,
  Forum_CategoryStickyThreadUpdateEvent_V1001 as CategoryStickyThreadUpdateEvent_V1001,
  Forum_PostAddedEvent_V1001 as PostAddedEvent_V1001,
  Forum_PostDeletedEvent_V1001 as PostDeletedEvent_V1001,
  Forum_PostModeratedEvent_V1001 as PostModeratedEvent_V1001,
  Forum_PostTextUpdatedEvent_V1001 as PostTextUpdatedEvent_V1001,
  Forum_ThreadCreatedEvent_V1001 as ThreadCreatedEvent_V1001,
  Forum_ThreadDeletedEvent_V1001 as ThreadDeletedEvent_V1001,
  Forum_ThreadMetadataUpdatedEvent_V1001 as ThreadMetadataUpdatedEvent_V1001,
  Forum_ThreadModeratedEvent_V1001 as ThreadModeratedEvent_V1001,
  Forum_ThreadMovedEvent_V1001 as ThreadMovedEvent_V1001,
} from '../generated/types'
import {
  RelationsArr,
  bytesToString,
  deserializeMetadata,
  genericEventFields,
  getByIdOrFail,
  getOneByOrFail,
  getWorkerOrFail,
  invalidMetadata,
  prepareString,
} from './common'

async function getCategoryOrFail(
  store: DatabaseManager,
  categoryId: string,
  relations?: RelationsArr<ForumCategory>
): Promise<ForumCategory> {
  return getByIdOrFail(store, ForumCategory, categoryId, relations)
}

async function getThreadOrFail(store: DatabaseManager, threadId: string): Promise<ForumThread> {
  return getByIdOrFail(store, ForumThread, threadId)
}

async function getPostOrFail(
  store: DatabaseManager,
  postId: string,
  relations?: RelationsArr<ForumPost>
): Promise<ForumPost> {
  return getByIdOrFail(store, ForumPost, postId, relations)
}

type ModerationType = 'runtime' | 'leadRemark' | 'workerRemark'

async function canModerate(store: DatabaseManager, actorId: string, categoryId: string): Promise<boolean> {
  const category = await getCategoryOrFail(store, categoryId, ['moderators', 'parent'])
  return (
    category.moderators.some(({ id }) => id === actorId) ||
    (category.parent ? canModerate(store, actorId, category.parent.id) : false)
  )
}

export async function moderatePost(
  store: DatabaseManager,
  event: SubstrateEvent,
  type: ModerationType,
  postId: string,
  actor: Worker,
  rationale: string
): Promise<void> {
  const post = await store.get(ForumPost, { where: { id: postId }, relations: ['thread', 'thread.category'] })

  if (!post) {
    const message = `Forum post not found by id: ${postId}`
    if (type === 'runtime') {
      throw Error(message)
    }
    return invalidMetadata(message)
  }
  if (type !== 'runtime' && post.status.isTypeOf !== 'PostStatusLocked') {
    return invalidMetadata(
      `Trying to moderate forum post ${post.id}, with status ${post.status.isTypeOf}. Only locked forum post can be moderated with remark`
    )
  }
  if (type === 'workerRemark' && !(await canModerate(store, actor.id, post.thread.category.id))) {
    return invalidMetadata(`The worker ${actor.id} can not moderate the post: ${post.id}`)
  }

  const postModeratedEvent = new PostModeratedEvent({
    ...genericEventFields(event),
    actor,
    post,
    rationale,
  })

  await store.save<PostModeratedEvent>(postModeratedEvent)

  const newStatus = new PostStatusModerated()
  newStatus.postModeratedEventId = postModeratedEvent.id

  post.status = newStatus
  post.isVisible = false
  await store.save<ForumPost>(post)

  const { thread } = post
  --thread.visiblePostsCount
  await store.save<ForumThread>(thread)
}

async function getActorWorker(store: DatabaseManager, actor: PrivilegedActor): Promise<Worker> {
  const worker = await getOneByOrFail(
    store,
    Worker,
    {
      group: { id: 'forumWorkingGroup' },
      ...(actor.isLead ? { isLead: true } : { runtimeId: actor.asModerator.toNumber() }),
    },
    ['group']
  )

  return worker
}

function normalizeForumTagLabel(label: string): string {
  // Optionally: normalize to lowercase & ASCII only?
  return prepareString(label)
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
  { store }: StoreContext & EventContext,
  labels: string[]
): Promise<ForumThreadTag[]> {
  return Promise.all(
    labels.map(async (label) => {
      const forumTag =
        (await store.get(ForumThreadTag, { where: { id: label } })) ||
        new ForumThreadTag({
          id: label,
          visibleThreadsCount: 0,
        })
      ++forumTag.visibleThreadsCount
      await store.save<ForumThreadTag>(forumTag)
      return forumTag
    })
  )
}

async function unsetThreadTags({ store }: StoreContext & EventContext, tags: ForumThreadTag[]): Promise<void> {
  await Promise.all(
    tags.map(async (forumTag) => {
      --forumTag.visibleThreadsCount
      await store.save<ForumThreadTag>(forumTag)
    })
  )
}

export async function forum_CategoryCreated({ event, store }: EventContext & StoreContext): Promise<void> {
  const [categoryId, parentCategoryId, titleBytes, descriptionBytes] = new CategoryCreatedEvent_V1001(event).params

  const category = new ForumCategory({
    id: categoryId.toString(),
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
  const [categoryId, newArchivalStatus, privilegedActor] = new CategoryArchivalStatusUpdatedEvent_V1001(event).params
  const category = await getCategoryOrFail(store, categoryId.toString())
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
  await store.save<ForumCategory>(category)
}

export async function forum_CategoryDeleted({ event, store }: EventContext & StoreContext): Promise<void> {
  const [categoryId, privilegedActor] = new CategoryDeletedEvent_V1001(event).params
  const category = await getCategoryOrFail(store, categoryId.toString())
  const actorWorker = await getActorWorker(store, privilegedActor)

  const categoryDeletedEvent = new CategoryDeletedEvent({
    ...genericEventFields(event),
    category,
    actor: actorWorker,
  })
  await store.save<CategoryDeletedEvent>(categoryDeletedEvent)

  const newStatus = new CategoryStatusRemoved()
  newStatus.categoryDeletedEventId = categoryDeletedEvent.id

  category.status = newStatus
  await store.save<ForumCategory>(category)
}

export async function forum_ThreadCreated(ctx: EventContext & StoreContext): Promise<void> {
  const { event, store } = ctx
  const [categoryId, threadId, postId, memberId, threadMetaBytes, postTextBytes] = new ThreadCreatedEvent_V1001(event)
    .params
  const author = new Membership({ id: memberId.toString() })

  const { title, tags } = parseThreadMetadata(threadMetaBytes)

  const thread = new ForumThread({
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
  const [threadId, rationaleBytes, privilegedActor] = new ThreadModeratedEvent_V1001(event).params
  const actorWorker = await getActorWorker(store, privilegedActor)
  const thread = await getThreadOrFail(store, threadId.toString())

  const threadModeratedEvent = new ThreadModeratedEvent({
    ...genericEventFields(event),
    actor: actorWorker,
    thread,
    rationale: bytesToString(rationaleBytes),
  })

  await store.save<ThreadModeratedEvent>(threadModeratedEvent)

  const newStatus = new ThreadStatusModerated()
  newStatus.threadModeratedEventId = threadModeratedEvent.id

  thread.status = newStatus
  thread.isVisible = false
  thread.visiblePostsCount = 0
  await unsetThreadTags(ctx, thread.tags || [])
  await store.save<ForumThread>(thread)
}

export async function forum_ThreadMetadataUpdated(ctx: EventContext & StoreContext): Promise<void> {
  const { event, store } = ctx
  const [threadId, , , newMetadataBytes] = new ThreadMetadataUpdatedEvent_V1001(event).params
  const thread = await getThreadOrFail(store, threadId.toString())

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
  const [threadId, , , hide] = new ThreadDeletedEvent_V1001(event).params
  const thread = await getThreadOrFail(store, threadId.toString())

  const threadDeletedEvent = new ThreadDeletedEvent({
    ...genericEventFields(event),
    thread,
  })

  await store.save<ThreadDeletedEvent>(threadDeletedEvent)

  const status = hide.isTrue ? new ThreadStatusRemoved() : new ThreadStatusLocked()
  status.threadDeletedEventId = threadDeletedEvent.id
  thread.status = status
  if (hide.isTrue) {
    thread.isVisible = false
    thread.visiblePostsCount = 0
    await unsetThreadTags(ctx, thread.tags || [])
  }
  await store.save<ForumThread>(thread)
}

export async function forum_ThreadMoved({ event, store }: EventContext & StoreContext): Promise<void> {
  const [threadId, newCategoryId, privilegedActor, oldCategoryId] = new ThreadMovedEvent_V1001(event).params
  const thread = await getThreadOrFail(store, threadId.toString())
  const actorWorker = await getActorWorker(store, privilegedActor)

  const threadMovedEvent = new ThreadMovedEvent({
    ...genericEventFields(event),
    thread,
    oldCategory: new ForumCategory({ id: oldCategoryId.toString() }),
    newCategory: new ForumCategory({ id: newCategoryId.toString() }),
    actor: actorWorker,
  })

  await store.save<ThreadMovedEvent>(threadMovedEvent)

  thread.category = new ForumCategory({ id: newCategoryId.toString() })
  await store.save<ForumThread>(thread)
}

export async function forum_PostAdded({ event, store }: EventContext & StoreContext): Promise<void> {
  const [postId, forumUserId, , threadId, metadataBytes, isEditable] = new PostAddedEvent_V1001(event).params

  const thread = await getThreadOrFail(store, threadId.toString())
  const metadata = deserializeMetadata(ForumPostMetadata, metadataBytes)
  const postText = metadata ? metadata.text || '' : bytesToString(metadataBytes)
  const repliesToPost =
    typeof metadata?.repliesTo === 'number' &&
    (await store.get(ForumPost, { where: { id: metadata.repliesTo.toString() } }))

  const postStatus = isEditable.valueOf() ? new PostStatusActive() : new PostStatusLocked()
  const postOrigin = new PostOriginThreadReply()

  const post = new ForumPost({
    id: postId.toString(),
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
  await store.save<ForumThread>(thread)
}

export async function forum_CategoryStickyThreadUpdate({ event, store }: EventContext & StoreContext): Promise<void> {
  const [categoryId, newStickyThreadsIdsSet, privilegedActor] = new CategoryStickyThreadUpdateEvent_V1001(event).params
  const actorWorker = await getActorWorker(store, privilegedActor)
  const newStickyThreadsIds = Array.from(newStickyThreadsIdsSet.values()).map((id) => id.toString())
  const threadsToSetSticky = await store.getMany(ForumThread, {
    where: { category: { id: categoryId.toString() }, id: In(newStickyThreadsIds) },
  })
  const threadsToUnsetSticky = await store.getMany(ForumThread, {
    where: { category: { id: categoryId.toString() }, isSticky: true, id: Not(In(newStickyThreadsIds)) },
  })

  const setStickyUpdates = (threadsToSetSticky || []).map(async (t) => {
    t.isSticky = true
    await store.save<ForumThread>(t)
  })

  const unsetStickyUpdates = (threadsToUnsetSticky || []).map(async (t) => {
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
  const [moderatorId, categoryId, canModerate] = new CategoryMembershipOfModeratorUpdatedEvent_V1001(event).params
  const moderator = await getWorkerOrFail(store, 'forumWorkingGroup', moderatorId.toNumber())
  const category = await getCategoryOrFail(store, categoryId.toString(), ['moderators'])

  if (canModerate.valueOf()) {
    category.moderators.push(moderator)
    await store.save<ForumCategory>(category)
  } else {
    category.moderators.splice(category.moderators.map((m) => m.id).indexOf(moderator.id), 1)
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
  const [postId, rationaleBytes, privilegedActor] = new PostModeratedEvent_V1001(event).params
  const actorWorker = await getActorWorker(store, privilegedActor)
  await moderatePost(store, event, 'runtime', postId.toString(), actorWorker, bytesToString(rationaleBytes))
}

export async function forum_PostTextUpdated({ event, store }: EventContext & StoreContext): Promise<void> {
  const [postId, , , , newTextBytes] = new PostTextUpdatedEvent_V1001(event).params
  const post = await getPostOrFail(store, postId.toString())

  const postTextUpdatedEvent = new PostTextUpdatedEvent({
    ...genericEventFields(event),
    post,
    newText: bytesToString(newTextBytes),
  })

  await store.save<PostTextUpdatedEvent>(postTextUpdatedEvent)

  post.text = bytesToString(newTextBytes)
  await store.save<ForumPost>(post)
}

export async function forum_PostDeleted({ event, store }: EventContext & StoreContext): Promise<void> {
  const [rationaleBytes, userId, postsData] = new PostDeletedEvent_V1001(event).params

  const postDeletedEvent = new PostDeletedEvent({
    ...genericEventFields(event),
    actor: new Membership({ id: userId.toString() }),
    rationale: bytesToString(rationaleBytes),
  })

  await store.save<PostDeletedEvent>(postDeletedEvent)

  await Promise.all(
    Array.from(postsData.entries()).map(async ([{ postId }, hideFlag]) => {
      const post = await getPostOrFail(store, postId.toString(), ['thread'])
      const newStatus = hideFlag.isTrue ? new PostStatusRemoved() : new PostStatusLocked()
      newStatus.postDeletedEventId = postDeletedEvent.id
      post.status = newStatus
      post.deletedInEvent = postDeletedEvent
      post.isVisible = hideFlag.isFalse
      await store.save<ForumPost>(post)

      if (hideFlag.isTrue) {
        const { thread } = post
        --thread.visiblePostsCount
        await store.save<ForumThread>(thread)
      }
    })
  )
}
