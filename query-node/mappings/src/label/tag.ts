import { DatabaseManager } from '@joystream/hydra-common'
import {
  ICreateTag,
  IUpdateTag,
  IAssignTagToThread,
  IAssignTagToProposal,
  IUnassignTagFromThread,
  IUnassignTagFromProposal,
  IAllowTagToWorker,
  IDisallowTagToWorker,
} from '@joystream/metadata-protobuf'
import { DecodedMetadataObject } from '@joystream/metadata-protobuf/types'
import { Tag, TagToWorker, TagToThread, TagToProposal, ForumThread, Proposal } from 'query-node/dist/model'
import { MetaprotocolTxError, getOneBy, getById, logger } from 'src/common'

export async function processCreateTag(
  store: DatabaseManager,
  metadata: DecodedMetadataObject<ICreateTag>,
  isLead: boolean
): Promise<any> {
  const { name, description, type, visibility } = metadata

  if (isLead === false) {
    return MetaprotocolTxError.TagPermNotAllowed
  }

  const isTagExists = await getOneBy(store, Tag, { name: name })

  if (isTagExists) {
    return MetaprotocolTxError.TagAlreadyExists
  }

  const newTag = new Tag({
    name: name,
    description: description,
    type: type,
    visibility: visibility,
  })

  await store.save<Tag>(newTag)
  logger.info('Tag has been created', { name })

  return newTag
}

export async function processUpdateTag(
  store: DatabaseManager,
  metadata: DecodedMetadataObject<IUpdateTag>,
  isLead: boolean
): Promise<any> {
  const { tagId, name, description, type, visibility } = metadata

  if (isLead === false) {
    return MetaprotocolTxError.TagPermNotAllowed
  }

  const tag: Tag | undefined = await getById(store, Tag, tagId)

  if (!tag) {
    return MetaprotocolTxError.TagNotFound
  }

  if (name) {
    tag.name = name
  }

  if (description) {
    tag.description = description
  }

  if (type) {
    tag.type = type
  }

  if (visibility) {
    tag.visibility = visibility
  }

  await store.save<Tag>(tag)

  logger.info('Tag has been created', { name })
  return tag
}

export async function processAssignTagToThread(
  store: DatabaseManager,
  metadata: DecodedMetadataObject<IAssignTagToThread>,
  isLead: boolean,
  workerId: number
): Promise<any> {
  const { tagId, threadId } = metadata

  if (!isLead) {
    const tagToWorker: TagToWorker | undefined = await getOneBy(store, TagToWorker, {
      tagId: tagId,
      workerId: workerId.toString(),
    })
    if (!tagToWorker) {
      return MetaprotocolTxError.TagPermNotAllowed
    }
  }

  const forumThread: ForumThread | undefined = await getById(store, ForumThread, threadId)
  if (!forumThread) {
    return MetaprotocolTxError.TagInvalidThreadId
  }

  const tagToThread: TagToThread | undefined = await getOneBy(store, TagToThread, { tagId: tagId, threadId: threadId })

  if (!tagToThread) {
    const newTagToThread = new TagToThread({
      tagId: tagId,
      threadId: threadId,
    })
    await store.save<TagToThread>(newTagToThread)
  }

  logger.info('TagToThread has been assigned', { tagId, threadId })
  return tagToThread
}

export async function processAssignTagToProposal(
  store: DatabaseManager,
  metadata: DecodedMetadataObject<IAssignTagToProposal>,
  isLead: boolean,
  workerId: number
): Promise<any> {
  const { tagId, proposalId } = metadata

  if (!isLead) {
    const tagToWorker: TagToWorker | undefined = await getOneBy(store, TagToWorker, {
      tagId: tagId,
      workerId: workerId.toString(),
    })
    if (!tagToWorker) {
      return MetaprotocolTxError.TagPermNotAllowed
    }
  }

  const proposal: Proposal | undefined = await getById(store, Proposal, proposalId)
  if (!proposal) {
    return MetaprotocolTxError.TagInvalidProposalId
  }

  const tagToProposal: TagToProposal | undefined = await getOneBy(store, TagToProposal, {
    tagId: tagId,
    proposalId: proposalId,
  })

  if (!tagToProposal) {
    const newTagToProposal = new TagToProposal({
      tagId: tagId,
      proposalId: proposalId,
    })
    await store.save<TagToProposal>(newTagToProposal)
  }

  logger.info('TagToProposal has been assigned', { tagId, proposalId })
  return tagToProposal
}

export async function processUnassignTagFromThread(
  store: DatabaseManager,
  metadata: DecodedMetadataObject<IUnassignTagFromThread>,
  isLead: boolean,
  workerId: number
): Promise<any> {
  const { tagId, threadId } = metadata

  if (!isLead) {
    const tagToWorker: TagToWorker | undefined = await getOneBy(store, TagToWorker, {
      tagId: tagId,
      workerId: workerId.toString(),
    })
    if (!tagToWorker) {
      return MetaprotocolTxError.TagPermNotAllowed
    }
  }

  const forumThread: ForumThread | undefined = await getById(store, ForumThread, threadId)
  if (!forumThread) {
    return MetaprotocolTxError.TagInvalidThreadId
  }

  const tagToThread: TagToThread | undefined = await getOneBy(store, TagToThread, { tagId: tagId, threadId: threadId })

  if (tagToThread) {
    await store.remove<TagToThread>(tagToThread)
  }

  logger.info('TagToThread has been unassigned', { tagId, threadId })
  return tagToThread
}

export async function processUnassignTagFromProposal(
  store: DatabaseManager,
  metadata: DecodedMetadataObject<IUnassignTagFromProposal>,
  isLead: boolean,
  workerId: number
): Promise<any> {
  const { tagId, proposalId } = metadata

  if (!isLead) {
    const tagToWorker: TagToWorker | undefined = await getOneBy(store, TagToWorker, {
      tagId: tagId,
      workerId: workerId.toString(),
    })
    if (!tagToWorker) {
      return MetaprotocolTxError.TagPermNotAllowed
    }
  }

  const proposal: Proposal | undefined = await getById(store, Proposal, proposalId)
  if (!proposal) {
    return MetaprotocolTxError.TagInvalidProposalId
  }

  const tagToProposal: TagToProposal | undefined = await getOneBy(store, TagToProposal, {
    tagId: tagId,
    proposalId: proposalId,
  })

  if (tagToProposal) {
    await store.remove<TagToProposal>(tagToProposal)
  }

  logger.info('TagToProposal has been unassigned', { tagId, proposalId })
  return tagToProposal
}

export async function processAllowTagToWorker(
  store: DatabaseManager,
  metadata: DecodedMetadataObject<IAllowTagToWorker>,
  isLead: boolean
): Promise<any> {
  const { tagId, workerId: assigneeId } = metadata

  if (!isLead) {
    return MetaprotocolTxError.TagPermNotAllowed
  }

  const tagToWorker: TagToWorker | undefined = await getOneBy(store, TagToWorker, {
    tagId: tagId,
    workerId: assigneeId,
  })

  if (!tagToWorker) {
    const newTagToWorker = new TagToWorker({
      tagId: tagId,
      workerId: assigneeId,
    })
    await store.save<TagToWorker>(newTagToWorker)
  }

  logger.info('TagToWorker has been allowed', { tagId, assigneeId })
}

export async function processDisallowTagToWorker(
  store: DatabaseManager,
  metadata: DecodedMetadataObject<IDisallowTagToWorker>,
  isLead: boolean
): Promise<any> {
  const { tagId, workerId: assigneeId } = metadata

  if (!isLead) {
    return MetaprotocolTxError.TagPermNotAllowed
  }

  const tagToWorker: TagToWorker | undefined = await getOneBy(store, TagToWorker, {
    tagId: tagId,
    workerId: assigneeId,
  })

  if (tagToWorker) {
    await store.remove<TagToWorker>(tagToWorker)
  }

  logger.info('TagToWorker has been disallowed', { tagId, assigneeId })
}
