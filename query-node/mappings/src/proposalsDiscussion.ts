/*
eslint-disable @typescript-eslint/naming-convention
*/
import { DatabaseManager, EventContext, StoreContext } from '@joystream/hydra-common'
import { ProposalsDiscussionPostMetadata } from '@joystream/metadata-protobuf'
import {
  Membership,
  ProposalDiscussionPost,
  ProposalDiscussionPostCreatedEvent,
  ProposalDiscussionPostDeletedEvent,
  ProposalDiscussionPostStatusActive,
  ProposalDiscussionPostStatusLocked,
  ProposalDiscussionPostStatusRemoved,
  ProposalDiscussionPostUpdatedEvent,
  ProposalDiscussionThread,
  ProposalDiscussionThreadModeChangedEvent,
  ProposalDiscussionThreadModeClosed,
  ProposalDiscussionThreadModeOpen,
  ProposalDiscussionWhitelist,
} from 'query-node/dist/model'
import { In } from 'typeorm'
import {
  ProposalsDiscussion_PostCreatedEvent_V1001 as PostCreatedEvent_V1001,
  ProposalsDiscussion_PostDeletedEvent_V1001 as PostDeletedEvent_V1001,
  ProposalsDiscussion_PostUpdatedEvent_V1001 as PostUpdatedEvent_V1001,
  ProposalsDiscussion_ThreadModeChangedEvent_V1001 as ThreadModeChangedEvent_V1001,
} from '../generated/types'
import { bytesToString, deserializeMetadata, genericEventFields, getByIdOrFail, unimplementedError } from './common'

async function getPost(store: DatabaseManager, id: string) {
  return getByIdOrFail(store, ProposalDiscussionPost, id)
}

async function getThread(store: DatabaseManager, id: string) {
  return getByIdOrFail(store, ProposalDiscussionThread, id)
}

export async function proposalsDiscussion_PostCreated({ event, store }: EventContext & StoreContext): Promise<void> {
  const [postId, memberId, threadId, metadataBytes, editable] = new PostCreatedEvent_V1001(event).params

  const metadata = deserializeMetadata(ProposalsDiscussionPostMetadata, metadataBytes)

  const repliesTo =
    typeof metadata?.repliesTo === 'number'
      ? await store.get(ProposalDiscussionPost, { where: { id: metadata.repliesTo.toString() } })
      : undefined

  const text = typeof metadata?.text === 'string' ? metadata.text : bytesToString(metadataBytes)

  const post = new ProposalDiscussionPost({
    id: postId.toString(),
    author: new Membership({ id: memberId.toString() }),
    status: editable.isTrue ? new ProposalDiscussionPostStatusActive() : new ProposalDiscussionPostStatusLocked(),
    isVisible: true,
    text,
    repliesTo,
    discussionThread: new ProposalDiscussionThread({ id: threadId.toString() }),
  })
  await store.save<ProposalDiscussionPost>(post)

  const postCreatedEvent = new ProposalDiscussionPostCreatedEvent({
    ...genericEventFields(event),
    post: post,
    text,
  })
  await store.save<ProposalDiscussionPostCreatedEvent>(postCreatedEvent)
}

export async function proposalsDiscussion_PostUpdated({ event, store }: EventContext & StoreContext): Promise<void> {
  const [postId, , , newTextBytes] = new PostUpdatedEvent_V1001(event).params

  const post = await getPost(store, postId.toString())
  const newText = bytesToString(newTextBytes)

  post.text = newText
  await store.save<ProposalDiscussionPost>(post)

  const postUpdatedEvent = new ProposalDiscussionPostUpdatedEvent({
    ...genericEventFields(event),
    post,
    text: newText,
  })
  await store.save<ProposalDiscussionPostUpdatedEvent>(postUpdatedEvent)
}

export async function proposalsDiscussion_ThreadModeChanged({
  event,
  store,
}: EventContext & StoreContext): Promise<void> {
  const [threadId, threadMode, memberId] = new ThreadModeChangedEvent_V1001(event).params

  const thread = await getThread(store, threadId.toString())

  if (threadMode.isClosed) {
    const newMode = new ProposalDiscussionThreadModeClosed()
    const whitelistMemberIds = threadMode.asClosed
    const members = await store.getMany(Membership, {
      where: { id: In(Array.from(whitelistMemberIds.values()).map((id) => id.toString())) },
    })
    const whitelist = new ProposalDiscussionWhitelist({
      members,
    })
    await store.save<ProposalDiscussionWhitelist>(whitelist)
    newMode.whitelistId = whitelist.id
    thread.mode = newMode
  } else if (threadMode.isOpen) {
    const newMode = new ProposalDiscussionThreadModeOpen()
    thread.mode = newMode
  } else {
    unimplementedError(`Unsupported thread mode: ${threadMode}`)
  }

  await store.save<ProposalDiscussionThread>(thread)

  const threadModeChangedEvent = new ProposalDiscussionThreadModeChangedEvent({
    ...genericEventFields(event),
    actor: new Membership({ id: memberId.toString() }),
    newMode: thread.mode,
    thread: thread,
  })
  await store.save<ProposalDiscussionThreadModeChangedEvent>(threadModeChangedEvent)
}

export async function proposalsDiscussion_PostDeleted({ event, store }: EventContext & StoreContext): Promise<void> {
  const [memberId, , postId, hide] = new PostDeletedEvent_V1001(event).params
  const post = await getPost(store, postId.toString())

  const postDeletedEvent = new ProposalDiscussionPostDeletedEvent({
    ...genericEventFields(event),
    post,
    actor: new Membership({ id: memberId.toString() }),
  })
  await store.save<ProposalDiscussionPostDeletedEvent>(postDeletedEvent)

  const newStatus = hide.isTrue ? new ProposalDiscussionPostStatusRemoved() : new ProposalDiscussionPostStatusLocked()
  newStatus.deletedInEventId = postDeletedEvent.id
  post.isVisible = hide.isFalse
  post.status = newStatus
  await store.save<ProposalDiscussionPost>(post)
}
