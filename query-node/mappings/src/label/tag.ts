import _ from 'lodash'
import { DatabaseManager } from '@joystream/hydra-common'
import {
  ICreateTag,
  IUpdateTag,
  IAssignTagsToThread,
  IAssignTagsToProposal,
  IUnassignTagsFromThread,
  IUnassignTagsFromProposal,
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

export async function processAssignTagsToThread(
  store: DatabaseManager,
  metadata: DecodedMetadataObject<IAssignTagsToThread>,
  isLead: boolean,
  workerId: number
): Promise<any> {
  const { tagIds, threadId } = metadata

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

  const currentTagIds = (forumThread.newTags || []).map((t) => t.id)
  const tagIdsToSet = _.union(currentTagIds, tagIds)
  if (tagIdsToSet) {
    const tags = await Promise.all(tagIdsToSet.map(async (tagId: string) => await getById(store, Tag, tagId)))
    forumThread.newTags = tags.filter((t): t is Tag => !!t)
    await store.save<ForumThread>(forumThread)
  }

  logger.info('new Tag is assigned to ForumThread', { tagIds, threadId })
  return forumThread
}

export async function processAssignTagsToProposal(
  store: DatabaseManager,
  metadata: DecodedMetadataObject<IAssignTagsToProposal>,
  isLead: boolean,
  workerId: number
): Promise<any> {
  const { tagIds, proposalId } = metadata

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

  const currentTagIds = (proposal.tags || []).map((t) => t.id)
  const tagIdsToSet = _.union(currentTagIds, tagIds)
  if (tagIdsToSet) {
    const tags = await Promise.all(tagIdsToSet.map(async (tagId: string) => await getById(store, Tag, tagId)))
    proposal.tags = tags.filter((t): t is Tag => !!t)
    await store.save<Proposal>(proposal)
  }

  logger.info('new Tag is assigned to proposal', { tagIds, proposalId })
  return proposal
}

export async function processUnassignTagsFromThread(
  store: DatabaseManager,
  metadata: DecodedMetadataObject<IUnassignTagsFromThread>,
  isLead: boolean,
  workerId: number
): Promise<any> {
  const { tagIds, threadId } = metadata

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

  const remainedTags = (forumThread.newTags || []).filter((t) => !(tagIds || []).includes(t.id))
  forumThread.newTags = remainedTags
  await store.save<ForumThread>(forumThread)

  logger.info('tag is unassigned from forumThread', { tagIds, threadId })
  return forumThread
}

export async function processUnassignTagsFromProposal(
  store: DatabaseManager,
  metadata: DecodedMetadataObject<IUnassignTagsFromProposal>,
  isLead: boolean,
  workerId: number
): Promise<any> {
  const { tagIds, proposalId } = metadata

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

  const remainedTags = (proposal.tags || []).filter((t) => !(tagIds || []).includes(t.id))
  proposal.tags = remainedTags
  await store.save<Proposal>(proposal)

  logger.info('tag is unassigned from proposal', { tagIds, proposalId })
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
