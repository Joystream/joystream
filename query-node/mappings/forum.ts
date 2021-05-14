/*
eslint-disable @typescript-eslint/naming-convention
*/
import { SubstrateEvent } from '@dzlzv/hydra-common'
import { DatabaseManager } from '@dzlzv/hydra-db-utils'
import BN from 'bn.js'
import { bytesToString, createEvent } from './common'
import {
  CategoryCreatedEvent,
  CategoryStatusActive,
  CategoryUpdatedEvent,
  EventType,
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
  ThreadTitleUpdatedEvent,
  ThreadDeletedEvent,
  ThreadStatusLocked,
  ThreadStatusRemoved,
  ThreadMovedEvent,
  ForumPost,
  PostStatusActive,
  PostOriginThreadInitial,
  VoteOnPollEvent,
} from 'query-node/dist/model'
import { Forum } from './generated/types'
import { PrivilegedActor } from '@joystream/types/augment/all'

async function getCategory(db: DatabaseManager, categoryId: string): Promise<ForumCategory> {
  const category = await db.get(ForumCategory, { where: { id: categoryId } })
  if (!category) {
    throw new Error(`Forum category not found by id: ${categoryId}`)
  }

  return category
}

async function getThread(db: DatabaseManager, threadId: string): Promise<ForumThread> {
  const thread = await db.get(ForumThread, { where: { id: threadId } })
  if (!thread) {
    throw new Error(`Forum thread not found by id: ${threadId.toString()}`)
  }

  return thread
}

async function getPollAlternative(db: DatabaseManager, threadId: string, index: number) {
  const poll = await db.get(ForumPoll, { where: { thread: { id: threadId } }, relations: ['pollAlternatives'] })
  if (!poll) {
    throw new Error(`Forum poll not found by threadId: ${threadId.toString()}`)
  }
  const pollAlternative = poll.pollAlternatives?.find((alt) => alt.index === index)
  if (!pollAlternative) {
    throw new Error(`Froum poll alternative not found by index ${index} in thread ${threadId.toString()}`)
  }

  return pollAlternative
}

async function getActorWorker(db: DatabaseManager, actor: PrivilegedActor): Promise<Worker> {
  const worker = await db.get(Worker, {
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

export async function forum_CategoryCreated(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  event_.blockTimestamp = new BN(event_.blockTimestamp) // FIXME: Temporary fix for wrong blockTimestamp type
  const {
    categoryId,
    optCategoryId: parentCategoryId,
    bytess: { 0: title, 1: description },
  } = new Forum.CategoryCreatedEvent(event_).data
  const eventTime = new Date(event_.blockTimestamp.toNumber())

  const category = new ForumCategory({
    id: categoryId.toString(),
    createdAt: eventTime,
    updatedAt: eventTime,
    title: bytesToString(title),
    description: bytesToString(description),
    status: new CategoryStatusActive(),
    parent: parentCategoryId.isSome ? new ForumCategory({ id: parentCategoryId.unwrap().toString() }) : undefined,
  })

  await db.save<ForumCategory>(category)

  const event = await createEvent(db, event_, EventType.CategoryCreated)
  const categoryCreatedEvent = new CategoryCreatedEvent({
    createdAt: eventTime,
    updatedAt: eventTime,
    event,
    category,
  })
  await db.save<CategoryCreatedEvent>(categoryCreatedEvent)
}

export async function forum_CategoryUpdated(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  event_.blockTimestamp = new BN(event_.blockTimestamp) // FIXME: Temporary fix for wrong blockTimestamp type
  const { categoryId, privilegedActor, bool: newArchivalStatus } = new Forum.CategoryUpdatedEvent(event_).data
  const eventTime = new Date(event_.blockTimestamp.toNumber())
  const category = await getCategory(db, categoryId.toString())
  const actorWorker = await getActorWorker(db, privilegedActor)

  const event = await createEvent(db, event_, EventType.CategoryUpdated)
  const categoryUpdatedEvent = new CategoryUpdatedEvent({
    createdAt: eventTime,
    updatedAt: eventTime,
    category,
    event,
    newArchivalStatus: newArchivalStatus.valueOf(),
    actor: actorWorker,
  })
  await db.save<CategoryUpdatedEvent>(categoryUpdatedEvent)

  if (newArchivalStatus.valueOf()) {
    const status = new CategoryStatusArchived()
    status.categoryUpdatedEventId = categoryUpdatedEvent.id
    category.status = status
  } else {
    category.status = new CategoryStatusActive()
  }
  category.updatedAt = eventTime
  await db.save<ForumCategory>(category)
}

export async function forum_CategoryDeleted(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  event_.blockTimestamp = new BN(event_.blockTimestamp) // FIXME: Temporary fix for wrong blockTimestamp type
  const { categoryId, privilegedActor } = new Forum.CategoryDeletedEvent(event_).data
  const eventTime = new Date(event_.blockTimestamp.toNumber())
  const category = await getCategory(db, categoryId.toString())
  const actorWorker = await getActorWorker(db, privilegedActor)

  const event = await createEvent(db, event_, EventType.CategoryDeleted)
  const categoryDeletedEvent = new CategoryDeletedEvent({
    createdAt: eventTime,
    updatedAt: eventTime,
    category,
    event,
    actor: actorWorker,
  })
  await db.save<CategoryDeletedEvent>(categoryDeletedEvent)

  const newStatus = new CategoryStatusRemoved()
  newStatus.categoryDeletedEventId = categoryDeletedEvent.id

  category.updatedAt = eventTime
  category.status = newStatus
  await db.save<ForumCategory>(category)
}

export async function forum_ThreadCreated(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  event_.blockTimestamp = new BN(event_.blockTimestamp) // FIXME: Temporary fix for wrong blockTimestamp type
  const { forumUserId, categoryId, title, text, poll } = new Forum.CreateThreadCall(event_).args
  const { threadId } = new Forum.ThreadCreatedEvent(event_).data
  const eventTime = new Date(event_.blockTimestamp.toNumber())
  const author = new Membership({ id: forumUserId.toString() })

  const thread = new ForumThread({
    createdAt: eventTime,
    updatedAt: eventTime,
    id: threadId.toString(),
    author,
    category: new ForumCategory({ id: categoryId.toString() }),
    title: bytesToString(title),
    isSticky: false,
    status: new ThreadStatusActive(),
  })
  await db.save<ForumThread>(thread)

  if (poll.isSome) {
    const threadPoll = new ForumPoll({
      createdAt: eventTime,
      updatedAt: eventTime,
      description: bytesToString(poll.unwrap().description_hash), // FIXME: This should be raw description!
      endTime: new Date(poll.unwrap().end_time.toNumber()),
      thread,
    })
    await db.save<ForumPoll>(threadPoll)
    await Promise.all(
      poll.unwrap().poll_alternatives.map(async (alt, index) => {
        const alternative = new ForumPollAlternative({
          createdAt: eventTime,
          updatedAt: eventTime,
          poll: threadPoll,
          text: bytesToString(alt.alternative_text_hash), // FIXME: This should be raw text!
          index,
        })

        await db.save<ForumPollAlternative>(alternative)
      })
    )
  }

  const event = await createEvent(db, event_, EventType.ThreadCreated)
  const threadCreatedEvent = new ThreadCreatedEvent({
    createdAt: eventTime,
    updatedAt: eventTime,
    event,
    thread,
    title: bytesToString(title),
    text: bytesToString(text),
  })
  await db.save<ThreadCreatedEvent>(threadCreatedEvent)

  const postOrigin = new PostOriginThreadInitial()
  postOrigin.threadCreatedEventId = threadCreatedEvent.id

  const initialPost = new ForumPost({
    // FIXME: The postId is unknown
    createdAt: eventTime,
    updatedAt: eventTime,
    author,
    thread,
    text: bytesToString(text),
    status: new PostStatusActive(),
    origin: postOrigin,
  })
  await db.save<ForumPost>(initialPost)
}

export async function forum_ThreadModerated(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  event_.blockTimestamp = new BN(event_.blockTimestamp) // FIXME: Temporary fix for wrong blockTimestamp type
  const { threadId, bytes: rationaleBytes, privilegedActor } = new Forum.ThreadModeratedEvent(event_).data
  const eventTime = new Date(event_.blockTimestamp.toNumber())
  const actorWorker = await getActorWorker(db, privilegedActor)
  const thread = await getThread(db, threadId.toString())

  const event = await createEvent(db, event_, EventType.ThreadModerated)
  const threadModeratedEvent = new ThreadModeratedEvent({
    createdAt: eventTime,
    updatedAt: eventTime,
    actor: actorWorker,
    event,
    thread,
    rationale: bytesToString(rationaleBytes),
  })

  await db.save<ThreadModeratedEvent>(threadModeratedEvent)

  const newStatus = new ThreadStatusModerated()
  newStatus.threadModeratedEventId = threadModeratedEvent.id

  thread.updatedAt = eventTime
  thread.status = newStatus
  await db.save<ForumThread>(thread)
}

export async function forum_ThreadTitleUpdated(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  event_.blockTimestamp = new BN(event_.blockTimestamp) // FIXME: Temporary fix for wrong blockTimestamp type
  const { threadId, bytes: newTitleBytes } = new Forum.ThreadTitleUpdatedEvent(event_).data
  const eventTime = new Date(event_.blockTimestamp.toNumber())
  const thread = await getThread(db, threadId.toString())

  const event = await createEvent(db, event_, EventType.ThreadTitleUpdated)
  const threadTitleUpdatedEvent = new ThreadTitleUpdatedEvent({
    createdAt: eventTime,
    updatedAt: eventTime,
    event,
    thread,
    newTitle: bytesToString(newTitleBytes),
  })

  await db.save<ThreadTitleUpdatedEvent>(threadTitleUpdatedEvent)

  thread.updatedAt = eventTime
  thread.title = bytesToString(newTitleBytes)
  await db.save<ForumThread>(thread)
}

export async function forum_ThreadDeleted(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  event_.blockTimestamp = new BN(event_.blockTimestamp) // FIXME: Temporary fix for wrong blockTimestamp type
  const { threadId, bool: hide } = new Forum.ThreadDeletedEvent(event_).data
  const eventTime = new Date(event_.blockTimestamp.toNumber())
  const thread = await getThread(db, threadId.toString())

  const event = await createEvent(db, event_, EventType.ThreadDeleted)
  const threadDeletedEvent = new ThreadDeletedEvent({
    createdAt: eventTime,
    updatedAt: eventTime,
    event,
    thread,
  })

  await db.save<ThreadDeletedEvent>(threadDeletedEvent)

  const status = hide.valueOf() ? new ThreadStatusRemoved() : new ThreadStatusLocked()
  status.threadDeletedEventId = threadDeletedEvent.id
  thread.status = status
  thread.updatedAt = eventTime
  await db.save<ForumThread>(thread)
}

export async function forum_ThreadMoved(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  event_.blockTimestamp = new BN(event_.blockTimestamp) // FIXME: Temporary fix for wrong blockTimestamp type
  const {
    threadId,
    privilegedActor,
    categoryIds: { 0: newCategoryId, 1: oldCategoryId },
  } = new Forum.ThreadMovedEvent(event_).data
  const eventTime = new Date(event_.blockTimestamp.toNumber())
  const thread = await getThread(db, threadId.toString())
  const actorWorker = await getActorWorker(db, privilegedActor)

  const event = await createEvent(db, event_, EventType.ThreadMoved)
  const threadMovedEvent = new ThreadMovedEvent({
    createdAt: eventTime,
    updatedAt: eventTime,
    event,
    thread,
    oldCategory: new ForumCategory({ id: oldCategoryId.toString() }),
    newCategory: new ForumCategory({ id: newCategoryId.toString() }),
    actor: actorWorker,
  })

  await db.save<ThreadMovedEvent>(threadMovedEvent)

  thread.updatedAt = eventTime
  thread.category = new ForumCategory({ id: newCategoryId.toString() })
  await db.save<ForumThread>(thread)
}

export async function forum_VoteOnPoll(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  event_.blockTimestamp = new BN(event_.blockTimestamp) // FIXME: Temporary fix for wrong blockTimestamp type
  const { threadId, forumUserId, u32: alternativeIndex } = new Forum.VoteOnPollEvent(event_).data
  const eventTime = new Date(event_.blockTimestamp.toNumber())
  const pollAlternative = await getPollAlternative(db, threadId.toString(), alternativeIndex.toNumber())
  const votingMember = new Membership({ id: forumUserId.toString() })

  const event = await createEvent(db, event_, EventType.VoteOnPoll)
  const voteOnPollEvent = new VoteOnPollEvent({
    createdAt: eventTime,
    updatedAt: eventTime,
    event,
    pollAlternative,
    votingMember,
  })

  await db.save<VoteOnPollEvent>(voteOnPollEvent)
}

export async function forum_PostAdded(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  event_.blockTimestamp = new BN(event_.blockTimestamp) // FIXME: Temporary fix for wrong blockTimestamp type
  // TODO
}

export async function forum_PostModerated(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  event_.blockTimestamp = new BN(event_.blockTimestamp) // FIXME: Temporary fix for wrong blockTimestamp type
  // TODO
}

export async function forum_PostDeleted(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  event_.blockTimestamp = new BN(event_.blockTimestamp) // FIXME: Temporary fix for wrong blockTimestamp type
  // TODO
}

export async function forum_PostTextUpdated(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  event_.blockTimestamp = new BN(event_.blockTimestamp) // FIXME: Temporary fix for wrong blockTimestamp type
  // TODO
}

export async function forum_PostReacted(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  event_.blockTimestamp = new BN(event_.blockTimestamp) // FIXME: Temporary fix for wrong blockTimestamp type
  // TODO
}

export async function forum_CategoryStickyThreadUpdate(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  event_.blockTimestamp = new BN(event_.blockTimestamp) // FIXME: Temporary fix for wrong blockTimestamp type
  // TODO
}

export async function forum_CategoryMembershipOfModeratorUpdated(
  db: DatabaseManager,
  event_: SubstrateEvent
): Promise<void> {
  event_.blockTimestamp = new BN(event_.blockTimestamp) // FIXME: Temporary fix for wrong blockTimestamp type
  // TODO
}
