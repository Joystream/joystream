import _ from 'lodash'
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
import { Tag, TagPermittedWorker, ForumThread, Proposal } from 'query-node/dist/model'
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
    const isTagExists = await getOneBy(store, Tag, { name: name })
    if (isTagExists) {
      return MetaprotocolTxError.TagAlreadyExists
    }

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
    const tagPermittedWorker: TagPermittedWorker | undefined = await getOneBy(store, TagPermittedWorker, {
      workerId: workerId.toString(),
    })
    if (!tagPermittedWorker) {
      return MetaprotocolTxError.TagPermNotAllowed
    }
  }

  const forumThread: ForumThread | undefined = await getById(store, ForumThread, threadId)
  if (!forumThread) {
    return MetaprotocolTxError.TagInvalidThreadId
  }

  const tag: Tag | undefined = await getById(store, Tag, tagId)
  if (!tag) {
    return MetaprotocolTxError.TagNotFound
  }

  const currentTagIds = (forumThread.newTags || []).map((t) => t.id)
  const tagIdsToSet = _.difference([tagId], currentTagIds)
  if (tagIdsToSet) {
    forumThread.newTags.push(tag)
    await store.save<ForumThread>(forumThread)
  }

  logger.info('new Tag is assigned to ForumThread', { tagId, threadId })
  return forumThread
}

export async function processAssignTagToProposal(
  store: DatabaseManager,
  metadata: DecodedMetadataObject<IAssignTagToProposal>,
  isLead: boolean,
  workerId: number
): Promise<any> {
  const { tagId, proposalId } = metadata

  if (!isLead) {
    const tagPermittedWorker: TagPermittedWorker | undefined = await getOneBy(store, TagPermittedWorker, {
      workerId: workerId.toString(),
    })
    if (!tagPermittedWorker) {
      return MetaprotocolTxError.TagPermNotAllowed
    }
  }

  const proposal: Proposal | undefined = await getById(store, Proposal, proposalId)
  if (!proposal) {
    return MetaprotocolTxError.TagInvalidProposalId
  }

  const tag: Tag | undefined = await getById(store, Tag, tagId)
  if (!tag) {
    return MetaprotocolTxError.TagNotFound
  }

  const currentTagIds = (proposal.tags || []).map((t) => t.id)
  const tagIdsToSet = _.difference([tagId], currentTagIds)
  if (tagIdsToSet) {
    proposal.tags.push(tag)
    await store.save<Proposal>(proposal)
  }

  logger.info('new Tag is assigned to proposal', { tagId, proposalId })
  return proposal
}

export async function processUnassignTagFromThread(
  store: DatabaseManager,
  metadata: DecodedMetadataObject<IUnassignTagFromThread>,
  isLead: boolean,
  workerId: number
): Promise<any> {
  const { tagId, threadId } = metadata

  if (!isLead) {
    const tagPermittedWorker: TagPermittedWorker | undefined = await getOneBy(store, TagPermittedWorker, {
      workerId: workerId.toString(),
    })
    if (!tagPermittedWorker) {
      return MetaprotocolTxError.TagPermNotAllowed
    }
  }

  const forumThread: ForumThread | undefined = await getById(store, ForumThread, threadId)
  if (!forumThread) {
    return MetaprotocolTxError.TagInvalidThreadId
  }

  const remainedTags = (forumThread.newTags || []).filter((t) => ![tagId].includes(t.id))
  forumThread.newTags = remainedTags
  await store.save<ForumThread>(forumThread)

  logger.info('tag is unassigned from forumThread', { tagId, threadId })
  return forumThread
}

export async function processUnassignTagFromProposal(
  store: DatabaseManager,
  metadata: DecodedMetadataObject<IUnassignTagFromProposal>,
  isLead: boolean,
  workerId: number
): Promise<any> {
  const { tagId, proposalId } = metadata

  if (!isLead) {
    const tagPermittedWorker: TagPermittedWorker | undefined = await getOneBy(store, TagPermittedWorker, {
      workerId: workerId.toString(),
    })
    if (!tagPermittedWorker) {
      return MetaprotocolTxError.TagPermNotAllowed
    }
  }

  const proposal: Proposal | undefined = await getById(store, Proposal, proposalId)
  if (!proposal) {
    return MetaprotocolTxError.TagInvalidProposalId
  }

  const remainedTags = (proposal.tags || []).filter((t) => ![tagId].includes(t.id))
  proposal.tags = remainedTags
  await store.save<Proposal>(proposal)

  logger.info('tag is unassigned from proposal', { tagId, proposalId })
  return proposal
}

export async function processAllowTagToWorker(
  store: DatabaseManager,
  metadata: DecodedMetadataObject<IAllowTagToWorker>
): Promise<any> {
  const { workerId: assigneeId } = metadata

  const tagPermittedWorker: TagPermittedWorker | undefined = await getOneBy(store, TagPermittedWorker, {
    workerId: assigneeId.toString(),
  })

  if (!tagPermittedWorker) {
    const newTagToWorker = new TagPermittedWorker({
      workerId: assigneeId,
    })
    await store.save<TagPermittedWorker>(newTagToWorker)
  }

  logger.info('TagPermittedWorker has been allowed', { assigneeId })
}

export async function processDisallowTagToWorker(
  store: DatabaseManager,
  metadata: DecodedMetadataObject<IDisallowTagToWorker>
): Promise<any> {
  const { workerId: assigneeId } = metadata

  const tagPermittedWorker: TagPermittedWorker | undefined = await getOneBy(store, TagPermittedWorker, {
    workerId: assigneeId.toString(),
  })

  if (tagPermittedWorker) {
    await store.remove<TagPermittedWorker>(tagPermittedWorker)
  }

  logger.info('TagToWorker has been disallowed', { assigneeId })
}
