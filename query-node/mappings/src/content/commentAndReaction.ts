import { DatabaseManager, SubstrateEvent } from '@joystream/hydra-common'
import {
  BanOrUnbanMemberFromChannel,
  IBanOrUnbanMemberFromChannel,
  ICreateComment,
  IDeleteComment,
  IEditComment,
  IModerateComment,
  IPinOrUnpinComment,
  IReactComment,
  IReactVideo,
  IVideoReactionsPreference,
  PinOrUnpinComment,
  ReactVideo,
  VideoReactionsPreference,
} from '@joystream/metadata-protobuf'
import { DecodedMetadataObject } from '@joystream/metadata-protobuf/types'
import {
  Channel,
  Comment,
  CommentCreatedEvent,
  CommentDeletedEvent,
  CommentModeratedEvent,
  CommentPinnedEvent,
  CommentReactedEvent,
  CommentReaction,
  CommentReactionsCountByReactionId,
  CommentStatus,
  CommentTextUpdatedEvent,
  ContentActor,
  MemberBannedFromChannelEvent,
  Membership,
  Video,
  VideoReactedEvent,
  VideoReaction,
  VideoReactionOptions,
  VideoReactionsCountByReactionType,
  VideoReactionsPreferenceEvent,
} from 'query-node/dist/model'
import { MetaprotocolTxError, RelationsArr, genericEventFields, getById, newMetaprotocolEntityId } from '../common'

async function getVideo(store: DatabaseManager, videoId: string, relations?: string[]): Promise<Video | undefined> {
  return getById(store, Video, videoId, relations as RelationsArr<Video>)
}

async function getComment(
  store: DatabaseManager,
  commentId: string,
  relations?: string[]
): Promise<Comment | undefined> {
  return getById(store, Comment, commentId, relations as RelationsArr<Comment>)
}

function isMemberBannedFromChannel(channel: Channel, memberId: string) {
  return channel.bannedMembers.some((bannedMember) => bannedMember.id === memberId)
}

function videoReactionEntityId(idSegments: { memberId: string; videoId: string }) {
  const { memberId, videoId } = idSegments
  return `${memberId}-${videoId}`
}

function commentReactionEntityId(idSegments: { memberId: string; commentId: string; reactionId: number }) {
  const { memberId, commentId, reactionId } = idSegments
  return `${memberId}-${commentId}-${reactionId}`
}

async function getOrCreateVideoReactionsCountByReactionId(
  store: DatabaseManager,
  video: Video,
  reaction: VideoReactionOptions
): Promise<VideoReactionsCountByReactionType> {
  const reactionsCountByReactionId = await store.get(VideoReactionsCountByReactionType, {
    where: { id: `${video.id}-${reaction}` },
  })

  if (!reactionsCountByReactionId) {
    const newReactionsCountByReactionId = new VideoReactionsCountByReactionType({
      id: `${video.id}-${reaction}`,
      reaction,
      video,
      count: 0,
    })

    await store.save<VideoReactionsCountByReactionType>(newReactionsCountByReactionId)
    return newReactionsCountByReactionId
  }

  return reactionsCountByReactionId
}

async function getOrCreateCommentReactionsCountByReactionId(
  store: DatabaseManager,
  comment: Comment,
  reactionId: number
): Promise<CommentReactionsCountByReactionId> {
  const reactionsCountByReactionId = await getById(
    store,
    CommentReactionsCountByReactionId,
    `${comment.id}-${reactionId}`
  )

  if (!reactionsCountByReactionId) {
    const newReactionsCountByReactionId = new CommentReactionsCountByReactionId({
      id: `${comment.id}-${reactionId}`,
      reactionId,
      comment,
      video: comment.video,
      count: 0,
    })

    await store.save<CommentReactionsCountByReactionId>(newReactionsCountByReactionId)
    return newReactionsCountByReactionId
  }

  return reactionsCountByReactionId
}

export function setReactionsAndRepliesCount(
  event: SubstrateEvent,
  entity: Video | Comment,
  reactionsCountByReactionId: VideoReactionsCountByReactionType | CommentReactionsCountByReactionId,
  operation: 'INCREMENT' | 'DECREMENT'
): void {
  const change = operation === 'INCREMENT' ? 1 : -1

  reactionsCountByReactionId.count += change

  entity.reactionsCount += change
  if (entity instanceof Comment) {
    entity.reactionsAndRepliesCount += change
  }
}

function parseVideoReaction(reaction: ReactVideo.Reaction): VideoReactionOptions {
  switch (reaction) {
    case ReactVideo.Reaction.LIKE: {
      return VideoReactionOptions.LIKE
    }
    case ReactVideo.Reaction.UNLIKE: {
      return VideoReactionOptions.UNLIKE
    }
  }
}

export async function processReactVideoMessage(
  store: DatabaseManager,
  event: SubstrateEvent,
  member: Membership,
  metadata: DecodedMetadataObject<IReactVideo>
): Promise<Video | MetaprotocolTxError> {
  const { videoId, reaction } = metadata
  const reactionResult = parseVideoReaction(reaction)

  const changeOrRemovePreviousReaction = async (
    store: DatabaseManager,
    video: Video,
    previousReactionByMember: VideoReaction,
    reaction: VideoReactionOptions
  ) => {
    // remove the reaction if member has already reacted with the same option else change the reaction
    if (reaction === previousReactionByMember.reaction) {
      // decrement reactions count
      setReactionsAndRepliesCount(event, video, reactionsCountByReactionType, 'DECREMENT')
      // remove reaction
      await store.remove<VideoReaction>(previousReactionByMember)
      return
    }

    // increment reaction count of current reaction type
    ++reactionsCountByReactionType.count

    const reactionsCountByReactionTypeOfPreviousReaction = await getOrCreateVideoReactionsCountByReactionId(
      store,
      video,
      previousReactionByMember.reaction
    )

    // decrement reaction count of previous reaction type
    --reactionsCountByReactionTypeOfPreviousReaction.count

    // save reactionsCount of previous reaction
    await store.save<VideoReactionsCountByReactionType>(reactionsCountByReactionTypeOfPreviousReaction)

    previousReactionByMember.reaction = reaction

    // update reaction
    await store.save<VideoReaction>(previousReactionByMember)
  }

  // load video
  const video = await getVideo(store, videoId, ['channel', 'channel.bannedMembers'])
  if (!video) {
    return MetaprotocolTxError.VideoNotFound
  }

  // ensure member is not banned from channel
  const isBanned = isMemberBannedFromChannel(video.channel, member.id)
  if (isBanned) {
    return MetaprotocolTxError.MemberBannedFromChannel
  }

  // ensure reaction feature is enabled on the video
  if (!video.isReactionFeatureEnabled) {
    return MetaprotocolTxError.VideoReactionsDisabled
  }

  // load previous reaction by member to the video (if any)
  const previousReactionByMember = await store.get(VideoReaction, {
    where: { id: videoReactionEntityId({ memberId: member.id, videoId }) },
  })

  // load video reaction count by reaction type (LIKE/UNLIKE)
  const reactionsCountByReactionType = await getOrCreateVideoReactionsCountByReactionId(store, video, reactionResult)

  if (previousReactionByMember) {
    await changeOrRemovePreviousReaction(store, video, previousReactionByMember, reactionResult)
  } else {
    // new reaction
    const newReactionByMember = new VideoReaction({
      id: videoReactionEntityId({ memberId: member.id, videoId }),
      video,
      reaction: reactionResult,
      memberId: member.id,
      member,
    })

    setReactionsAndRepliesCount(event, video, reactionsCountByReactionType, 'INCREMENT')
    // add reaction
    await store.save<VideoReaction>(newReactionByMember)
  }

  // save updated comment
  await store.save<Video>(video)

  // save updated reactionsCount by Reaction type
  await store.save<VideoReactionsCountByReactionType>(reactionsCountByReactionType)

  // common event processing

  const videoReactedEvent = new VideoReactedEvent({
    ...genericEventFields(event),
    video,
    videoChannel: video.channel,
    reactingMember: member,
    reactionResult,
  })

  await store.save<VideoReactedEvent>(videoReactedEvent)

  return video
}

export async function processReactCommentMessage(
  store: DatabaseManager,
  event: SubstrateEvent,
  member: Membership,
  metadata: DecodedMetadataObject<IReactComment>
): Promise<Comment | MetaprotocolTxError> {
  const { commentId, reactionId } = metadata

  // load comment
  const comment = await getComment(store, commentId, ['video', 'video.channel', 'video.channel.bannedMembers'])

  // ensure comment exists & is not deleted or moderated
  if (!comment || comment.status !== CommentStatus.VISIBLE) {
    return MetaprotocolTxError.CommentNotFound
  }

  const { video } = comment

  // ensure member is not banned from channel
  const isBanned = isMemberBannedFromChannel(video.channel, member.id)
  if (isBanned) {
    return MetaprotocolTxError.MemberBannedFromChannel
  }

  // load same reaction by member to the comment (if any)
  const previousReactionByMember = await getById(
    store,
    CommentReaction,
    commentReactionEntityId({ memberId: member.id, commentId, reactionId })
  )

  // load video reaction count by reaction id
  const reactionsCountByReactionId = await getOrCreateCommentReactionsCountByReactionId(store, comment, reactionId)

  // remove the reaction if same reaction already exists by the member on the comment
  if (previousReactionByMember) {
    // decrement reactions count
    setReactionsAndRepliesCount(event, comment, reactionsCountByReactionId, 'DECREMENT')
    // remove reaction
    await store.remove<CommentReaction>(previousReactionByMember)
  } else {
    // new reaction
    const newReactionByMember = new CommentReaction({
      id: commentReactionEntityId({ memberId: member.id, commentId, reactionId }),
      comment,
      reactionId,
      video,
      memberId: member.id,
      member,
    })

    // increment reactions count
    setReactionsAndRepliesCount(event, comment, reactionsCountByReactionId, 'INCREMENT')
    // add reaction
    await store.save<CommentReaction>(newReactionByMember)
  }

  // save updated comment
  await store.save<Comment>(comment)

  // save updated reactionsCount by ReactionId
  await store.save<CommentReactionsCountByReactionId>(reactionsCountByReactionId)

  // common event processing

  const commentReactedEvent = new CommentReactedEvent({
    ...genericEventFields(event),
    comment,
    video,
    videoChannel: video.channel,
    reactingMember: member,
    reactionResult: reactionId,
  })

  await store.save<CommentReactedEvent>(commentReactedEvent)

  return comment
}

export async function processCreateCommentMessage(
  store: DatabaseManager,
  event: SubstrateEvent,
  member: Membership,
  metadata: DecodedMetadataObject<ICreateComment>
): Promise<Comment | MetaprotocolTxError> {
  const { videoId, parentCommentId, body } = metadata

  // load video
  const video = await getVideo(store, videoId, ['channel', 'channel.bannedMembers'])
  if (!video) {
    return MetaprotocolTxError.VideoNotFound
  }

  const { channel } = video

  // ensure member is not banned from channel
  const isBanned = isMemberBannedFromChannel(channel, member.id)
  if (isBanned) {
    return MetaprotocolTxError.MemberBannedFromChannel
  }

  // ensure video's comment section is enabled
  if (!video.isCommentSectionEnabled) {
    return MetaprotocolTxError.CommentSectionDisabled
  }

  // if new comment is replying to some parent comment, 1. validate that comment existence,
  //  2. set `parentComment` to the parent comment, otherwise set `parentComment` to undefined
  const parentComment = parentCommentId
    ? await getComment(store, parentCommentId.toString(), ['author', 'video'])
    : undefined

  if (parentComment && parentComment.video.id !== videoId.toString()) {
    return MetaprotocolTxError.ParentCommentNotFound
  }

  // increment video's comment count
  ++video.commentsCount
  await store.save<Video>(video)

  // increment parent comment's replies count
  if (parentComment) {
    ++parentComment.repliesCount
    ++parentComment.reactionsAndRepliesCount
    await store.save<Comment>(parentComment)
  }

  const comment = new Comment({
    id: newMetaprotocolEntityId(event),
    text: body,
    video,
    status: CommentStatus.VISIBLE,
    author: member,
    parentComment,
    repliesCount: 0,
    reactionsCount: 0,
    reactionsAndRepliesCount: 0,
    isEdited: false,
  })
  await store.save<Comment>(comment)

  // common event processing

  const commentCreatedEvent = new CommentCreatedEvent({
    ...genericEventFields(event),
    comment,
    video,
    videoChannel: channel,
    parentCommentAuthor: parentComment?.author,
    text: body,
  })

  await store.save<CommentCreatedEvent>(commentCreatedEvent)

  return comment
}

export async function processEditCommentMessage(
  store: DatabaseManager,
  event: SubstrateEvent,
  member: Membership,
  metadata: DecodedMetadataObject<IEditComment>
): Promise<Comment | MetaprotocolTxError> {
  const { commentId, newBody } = metadata

  // load comment
  const comment = await getComment(store, commentId, [
    'author',
    'edits',
    'video',
    'video.channel',
    'video.channel.bannedMembers',
  ])

  // ensure comment exists & is not deleted or moderated
  if (!comment || comment.status !== CommentStatus.VISIBLE) {
    return MetaprotocolTxError.CommentNotFound
  }

  const { video } = comment

  // ensure member is not banned from channel
  const isBanned = isMemberBannedFromChannel(video.channel, member.id)
  if (isBanned) {
    return MetaprotocolTxError.MemberBannedFromChannel
  }

  // ensure video's comment section is enabled
  if (!video.isCommentSectionEnabled) {
    return MetaprotocolTxError.CommentSectionDisabled
  }

  // ensure comment is being edited by author
  if (comment.author.id !== member.id) {
    return MetaprotocolTxError.InvalidCommentAuthor
  }

  // common event processing

  const commentTextUpdatedEvent = new CommentTextUpdatedEvent({
    ...genericEventFields(event),
    comment,
    video,
    videoChannel: video.channel,
    newText: newBody,
  })
  await store.save<CommentTextUpdatedEvent>(commentTextUpdatedEvent)

  comment.text = newBody
  comment.isEdited = true
  comment.edits?.push(commentTextUpdatedEvent)

  await store.save<Comment>(comment)

  return comment
}

export async function processDeleteCommentMessage(
  store: DatabaseManager,
  event: SubstrateEvent,
  member: Membership,
  metadata: DecodedMetadataObject<IDeleteComment>
): Promise<Comment | MetaprotocolTxError> {
  const { commentId } = metadata

  // load comment
  const comment = await getComment(store, commentId, [
    'author',
    'parentComment',
    'video',
    'video.channel',
    'video.channel.bannedMembers',
  ])

  // ensure comment exists & is not deleted or moderated
  if (!comment || comment.status !== CommentStatus.VISIBLE) {
    return MetaprotocolTxError.CommentNotFound
  }

  const { video, parentComment } = comment

  // ensure member is not banned from channel
  const isBanned = isMemberBannedFromChannel(video.channel, member.id)
  if (isBanned) {
    return MetaprotocolTxError.MemberBannedFromChannel
  }

  // ensure video's comment section is enabled
  if (!video.isCommentSectionEnabled) {
    return MetaprotocolTxError.CommentSectionDisabled
  }

  // ensure comment is being deleted by author
  if (comment.author.id !== member.id) {
    return MetaprotocolTxError.InvalidCommentAuthor
  }

  // decrement video's comment count
  --video.commentsCount
  await store.save<Video>(video)

  // decrement parent comment's replies count
  if (parentComment) {
    --parentComment.repliesCount
    --parentComment.reactionsAndRepliesCount
    await store.save<Comment>(parentComment)
  }

  comment.text = ''
  comment.status = CommentStatus.DELETED

  // common event processing

  const commentDeletedEvent = new CommentDeletedEvent({
    ...genericEventFields(event),
    comment,
    video,
    videoChannel: video.channel,
  })
  await store.save<CommentDeletedEvent>(commentDeletedEvent)

  comment.deletedInEvent = commentDeletedEvent

  // save deleted comment
  await store.save<Comment>(comment)

  return comment
}

export async function processModerateCommentMessage(
  store: DatabaseManager,
  event: SubstrateEvent,
  channelOwnerOrCurator: typeof ContentActor,
  channel: Channel,
  message: IModerateComment
): Promise<Comment | MetaprotocolTxError> {
  const { commentId, rationale } = message

  // load comment
  const comment = await getComment(store, commentId, ['parentComment', 'video', 'video.channel'])

  // ensure comment exists & is not deleted or moderated
  if (!comment || comment.status !== CommentStatus.VISIBLE) {
    return MetaprotocolTxError.CommentNotFound
  }

  const { video, parentComment } = comment

  // ensure channel owns the video
  if (video.channel.id !== channel.id) {
    return MetaprotocolTxError.VideoNotFoundInChannel
  }

  // decrement video's comment count
  --video.commentsCount

  // update video
  await store.save<Video>(video)

  // decrement parent comment's replies count
  if (parentComment) {
    --parentComment.repliesCount
    --parentComment.reactionsAndRepliesCount

    // update parent comment
    await store.save<Comment>(parentComment)
  }

  comment.text = ''
  comment.status = CommentStatus.MODERATED

  // common event processing

  const commentModeratedEvent = new CommentModeratedEvent({
    ...genericEventFields(event),
    comment,
    video,
    videoChannel: video.channel,
    actor: channelOwnerOrCurator,
    rationale,
  })
  await store.save<CommentModeratedEvent>(commentModeratedEvent)

  comment.moderatedInEvent = commentModeratedEvent

  // save deleted comment
  await store.save<Comment>(comment)

  return comment
}

export async function processPinOrUnpinCommentMessage(
  store: DatabaseManager,
  event: SubstrateEvent,
  channel: Channel,
  message: IPinOrUnpinComment
): Promise<Comment | MetaprotocolTxError> {
  const { commentId, option } = message

  // load comment
  const comment = await getComment(store, commentId, ['video', 'video.channel'])

  // ensure comment exists & is not deleted or moderated
  if (!comment || comment.status !== CommentStatus.VISIBLE) {
    return MetaprotocolTxError.CommentNotFound
  }

  const { video } = comment

  // ensure channel owns the video
  if (video.channel.id !== channel.id) {
    return MetaprotocolTxError.VideoNotFoundInChannel
  }

  video.pinnedComment = option === PinOrUnpinComment.Option.PIN ? comment : undefined
  await store.save<Video>(video)

  // common event processing

  const commentPinnedEvent = new CommentPinnedEvent({
    ...genericEventFields(event),
    comment,
    video,
    videoChannel: video.channel,
    action: option === PinOrUnpinComment.Option.PIN,
  })

  await store.save<CommentPinnedEvent>(commentPinnedEvent)

  return comment
}

export async function processBanOrUnbanMemberFromChannelMessage(
  store: DatabaseManager,
  event: SubstrateEvent,
  channel: Channel,
  message: IBanOrUnbanMemberFromChannel
): Promise<Membership | MetaprotocolTxError> {
  const { memberId, option } = message

  const member = await getById(store, Membership, memberId.toString(), ['memberBannedFromChannels'])
  if (!member) {
    return MetaprotocolTxError.MemberNotFound
  }

  // ban member from channel; if member is already banned it remains banned
  if (option === BanOrUnbanMemberFromChannel.Option.BAN) {
    member.memberBannedFromChannels.push(channel)
  }

  // unban member from channel; if member is already unbanned it remains banned
  if (option === BanOrUnbanMemberFromChannel.Option.UNBAN) {
    const updatedBannedFromChannelsList = member.memberBannedFromChannels.filter(
      (bannedFromChannel) => bannedFromChannel.id !== channel.id
    )
    member.memberBannedFromChannels = updatedBannedFromChannelsList
  }

  await store.save<Membership>(member)

  // common event processing

  const memberBannedFromChannelEvent = new MemberBannedFromChannelEvent({
    ...genericEventFields(event),
    channel,
    member,
    action: option === BanOrUnbanMemberFromChannel.Option.BAN,
  })

  await store.save<MemberBannedFromChannelEvent>(memberBannedFromChannelEvent)

  return member
}

export async function processVideoReactionsPreferenceMessage(
  store: DatabaseManager,
  event: SubstrateEvent,
  channel: Channel,
  message: IVideoReactionsPreference
): Promise<Channel | MetaprotocolTxError> {
  const { videoId, option } = message

  // load video
  const video = await getVideo(store, videoId.toString(), ['channel'])
  if (!video) {
    return MetaprotocolTxError.VideoNotFound
  }

  // ensure channel owns the video
  if (video.channel.id !== channel.id) {
    return MetaprotocolTxError.VideoNotFoundInChannel
  }

  video.isCommentSectionEnabled = option === VideoReactionsPreference.Option.ENABLE
  await store.save<Video>(video)

  // common event processing

  const videoReactionsPreferenceEvent = new VideoReactionsPreferenceEvent({
    ...genericEventFields(event),
    video,
    reactionsStatus: option === VideoReactionsPreference.Option.ENABLE,
  })

  await store.save<VideoReactionsPreferenceEvent>(videoReactionsPreferenceEvent)

  return video.channel
}
