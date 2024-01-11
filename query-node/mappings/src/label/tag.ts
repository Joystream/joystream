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
  IRemarkMetadataAction,
} from '@joystream/metadata-protobuf'
import { DecodedMetadataObject } from '@joystream/metadata-protobuf/types'
import { Tag, TagPermittedWorker, ForumThread, Proposal } from 'query-node/dist/model'
import { MetaprotocolTxError, getOneBy, getById, logger, invalidMetadata } from 'src/common'

export async function processTagMessage(
  store: DatabaseManager,
  metadata: DecodedMetadataObject<IRemarkMetadataAction>,
  groupName: string,
  isLead = true,
  workerId = 0
): Promise<any> {
  if (groupName !== 'forumWorkingGroup') {
    return invalidMetadata(`The ${groupName} is not allowed for Tags.`)
  }

  if (metadata?.createTag) {
    return await processCreateTag(store, metadata?.createTag, isLead)
  } else if (metadata?.updateTag) {
    return await processUpdateTag(store, metadata?.updateTag, isLead)
  } else if (metadata?.assignTagsToThread) {
    return await processAssignTagsToThread(store, metadata?.assignTagsToThread, isLead, workerId)
  } else if (metadata?.assignTagsToProposal) {
    return await processAssignTagsToProposal(store, metadata?.assignTagsToProposal, isLead, workerId)
  } else if (metadata?.unassignTagsFromThread) {
    return await processUnassignTagsFromThread(store, metadata?.unassignTagsFromThread, isLead, workerId)
  } else if (metadata?.unassignTagsFromProposal) {
    return await processUnassignTagsFromProposal(store, metadata?.unassignTagsFromProposal, isLead, workerId)
  } else if (metadata?.allowTagToWorker) {
    return await processAllowTagToWorker(store, metadata?.allowTagToWorker, isLead)
  } else if (metadata?.disallowTagToWorker) {
    return await processDisallowTagToWorker(store, metadata?.disallowTagToWorker, isLead)
  } else {
    return invalidMetadata('Unrecognized Tag format') // Never reached here
  }
}

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

  logger.info('Tag has been updated', { tagId, name, description })
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

  const tags = await Promise.all(tagIdsToSet.map(async (tagId: string) => await getById(store, Tag, tagId)))
  forumThread.newTags = tags.filter((t): t is Tag => !!t)
  await store.save<ForumThread>(forumThread)

  logger.info('Assigned forum thread tags', { threadId, tagIdsToSet })
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

  const tags = await Promise.all(tagIdsToSet.map(async (tagId: string) => await getById(store, Tag, tagId)))
  proposal.tags = tags.filter((t): t is Tag => !!t)
  await store.save<Proposal>(proposal)

  logger.info('Assigned proposal tags', { proposalId, tagIdsToSet })
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

  const remainingTags = (forumThread.newTags || []).filter((t) => !(tagIds || []).includes(t.id))
  forumThread.newTags = remainingTags
  await store.save<ForumThread>(forumThread)

  logger.info('Unassigned forum thread tags', { threadId, remainingTags })
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

  const remainingTags = (proposal.tags || []).filter((t) => !(tagIds || []).includes(t.id))
  proposal.tags = remainingTags
  await store.save<Proposal>(proposal)

  logger.info('Unassigned proposal tags', { proposalId, remainingTags })
  return proposal
}

export async function processAllowTagToWorker(
  store: DatabaseManager,
  metadata: DecodedMetadataObject<IAllowTagToWorker>,
  isLead: boolean
): Promise<any> {
  const { workerId: assigneeId } = metadata

  if (isLead === false) {
    return invalidMetadata(`The Worker is not permitted for this operation.`)
  }

  const tagPermittedWorker: TagPermittedWorker | undefined = await getOneBy(store, TagPermittedWorker, {
    workerId: assigneeId.toString(),
  })

  if (!tagPermittedWorker) {
    const newTagToWorker = new TagPermittedWorker({
      workerId: assigneeId,
    })
    await store.save<TagPermittedWorker>(newTagToWorker)
    logger.info(`The worker's permission is allowed`, { assigneeId })
  } else {
    return invalidMetadata(`The Worker's permission is already allowed.`)
  }
}

export async function processDisallowTagToWorker(
  store: DatabaseManager,
  metadata: DecodedMetadataObject<IDisallowTagToWorker>,
  isLead: boolean
): Promise<any> {
  const { workerId: assigneeId } = metadata

  if (isLead === false) {
    return invalidMetadata(`The Worker is not permitted for this operation.`)
  }

  const tagPermittedWorker: TagPermittedWorker | undefined = await getOneBy(store, TagPermittedWorker, {
    workerId: assigneeId.toString(),
  })

  if (tagPermittedWorker) {
    await store.remove<TagPermittedWorker>(tagPermittedWorker)
    logger.info(`The worker's permission is denied`, { assigneeId })
  } else {
    return invalidMetadata(`The Worker's permission is already denied.`)
  }
}
