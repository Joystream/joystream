import { DatabaseManager, EventContext, StoreContext } from '@joystream/hydra-common'
import {
  BanOrUnbanMemberFromChannel,
  EnableOrDisableCommentSectionOfVideo,
  EnableOrDisableReactionsOnVideo,
  IBanOrUnbanMemberFromChannel,
  ICreateComment,
  IDeleteComment,
  IDeleteCommentModerator,
  IEditComment,
  IEnableOrDisableCommentSectionOfVideo,
  IEnableOrDisableReactionsOnVideo,
  IPinOrUnpinComment,
  IReactComment,
  IReactVideo,
  PinOrUnpinComment,
  ReactVideo,
} from '@joystream/metadata-protobuf'
import { ChannelId, MemberId } from '@joystream/types/common'
import {
  Channel,
  Comment,
  CommentCreatedEvent,
  CommentDeletedByModeratorEvent,
  CommentDeletedEvent,
  CommentPinnedEvent,
  CommentReactedEvent,
  CommentReaction,
  CommentReactionsCountByReactionId,
  CommentStatus,
  CommentTextUpdatedEvent,
  Membership,
  Video,
  VideoReactedEvent,
  VideoReaction,
  VideoReactionOptions,
} from 'query-node/dist/model'
import { genericEventFields, inconsistentState, logger, newMetaprotocolEntityId } from '../common'

// TODO: Ensure video is actually a video
// TODO: make sure comment is fully removed (all of its reactions)
// TODO: make sure video is fully removed (all of its comments & reactions)

export async function processReactVideoMessage(
  { store, event }: EventContext & StoreContext,
  memberId: MemberId,
  message: IReactVideo
): Promise<void> {
  const { videoId, reaction } = message
  const eventTime = new Date(event.blockTimestamp)
  const reactionResult = parseVideoReaction(reaction)

  // load video
  const video = await getVideo(store, videoId.toString(), ['channel', 'channel.bannedMembers'])

  // ensure member is not banned from channel
  if (video.channel.bannedMembers.includes(new Membership({ id: memberId.toString() }))) {
    return inconsistentState(
      'Cannot add reaction; member is banned from participating on any video of the channelId: ',
      video.channel.id
    )
  }

  // ensure reaction feature is enabled on the video
  if (!video.isReactionFeatureEnabled) {
    return inconsistentState('Cannot add reaction; reaction feature is disabled on this video: ', video.channel.id)
  }

  // load reaction by member to the video (if any)
  const existingVideoReactionByMember = await store.get(VideoReaction, {
    where: { video: { id: videoId.toString() }, member: { id: memberId.toString() } },
  })

  if (existingVideoReactionByMember) {
    // if reaction option is `CANCEL`, remove the reaction otherwise set the updated one
    if (reactionResult === VideoReactionOptions.CANCEL) {
      --video.reactionsCount
      await store.remove<VideoReaction>(existingVideoReactionByMember)
      // emit log event
      logger.info(`Reaction has been removed by the member: ${memberId} to the video: ${videoId}`)
    } else {
      existingVideoReactionByMember.updatedAt = eventTime
      existingVideoReactionByMember.reaction = reactionResult

      await store.save<VideoReaction>(existingVideoReactionByMember)
      // emit log event
      logger.info(`Reaction has been updated by the member: ${memberId} to the video: ${videoId}`)
    }
  } else if (reactionResult !== VideoReactionOptions.CANCEL) {
    const newVideoReactionByMember = new VideoReaction({
      id: newMetaprotocolEntityId(event),
      createdAt: eventTime,
      updatedAt: eventTime,
      video,
      reaction: reactionResult,
      member: new Membership({ id: memberId.toString() }),
    })

    await store.save<VideoReaction>(newVideoReactionByMember)

    ++video.reactionsCount
  }

  const videoReactedEvent = new VideoReactedEvent({
    ...genericEventFields(event),
    video,
    reactingMember: new Membership({ id: memberId.toString() }),
    reactionResult,
  })
  await store.save<VideoReactedEvent>(videoReactedEvent)

  video.updatedAt = eventTime
  await store.save<Video>(video)
}

export async function processReactCommentMessage(
  { store, event }: EventContext & StoreContext,
  memberId: MemberId,
  message: IReactComment
): Promise<void> {
  const { commentId, reactionId } = message
  const eventTime = new Date(event.blockTimestamp)

  // load comment
  const comment = await getComment(store, commentId, [
    'video',
    'video.channel',
    'video.channel.bannedMembers',
    'reactionsCountByReactionId',
  ])
  const { video } = comment

  // ensure member is not banned from channel
  if (video.channel.bannedMembers.includes(new Membership({ id: memberId.toString() }))) {
    return inconsistentState(
      'Cannot add reaction; member is banned from participating on any video of the channelId: ',
      video.channel.id
    )
  }

  const commentReactedEvent = new CommentReactedEvent({
    ...genericEventFields(event),
    comment,
    reactingMember: new Membership({ id: memberId.toString() }),
    reactionResult: reactionId,
  })
  await store.save<CommentReactedEvent>(commentReactedEvent)

  // load same reaction by member to the comment (if any)
  const existingCommentReactionByMember = await store.get(CommentReaction, {
    where: { reactionId, comment: { id: commentId }, member: { id: memberId.toString() } },
  })

  const reactionsCount = await store.get(CommentReactionsCountByReactionId, {
    where: { reactionId, comment: { id: commentId.toString() } },
  })

  // remove the reaction if same reaction already exists by the member on the comment
  if (existingCommentReactionByMember) {
    if (reactionsCount) {
      --reactionsCount.count
      reactionsCount.updatedAt = eventTime
      await store.save<CommentReactionsCountByReactionId>(reactionsCount)
    }

    comment.updatedAt = eventTime
    await store.save<Comment>(comment)
    await store.remove<CommentReaction>(existingCommentReactionByMember)
    // emit log event
    logger.info(`Reaction has been removed by the member: ${memberId} to the commentId: ${commentId}`)
  } else {
    if (reactionsCount) {
      ++reactionsCount.count
      reactionsCount.updatedAt = eventTime
      await store.save<CommentReactionsCountByReactionId>(reactionsCount)
    } else {
      const newReactionsCount = new CommentReactionsCountByReactionId({
        id: newMetaprotocolEntityId(event),
        count: 1,
        reactionId,
        comment,
        createdAt: eventTime,
        updatedAt: eventTime,
      })
      await store.save<CommentReactionsCountByReactionId>(newReactionsCount)
    }

    const newVideoReactionByMember = new CommentReaction({
      id: newMetaprotocolEntityId(event),
      createdAt: eventTime,
      updatedAt: eventTime,
      comment,
      reactionId,
      video,
      member: new Membership({ id: memberId.toString() }),
    })
    await store.save<CommentReaction>(newVideoReactionByMember)

    // emit log event
    logger.info(`New reaction has been added by the member: ${memberId} to the commentId: ${commentId}`)
  }
}

function parseVideoReaction(reaction: ReactVideo.Reaction): VideoReactionOptions {
  switch (reaction) {
    case ReactVideo.Reaction.CANCEL: {
      return VideoReactionOptions.CANCEL
    }
    case ReactVideo.Reaction.LIKE: {
      return VideoReactionOptions.LIKE
    }
    case ReactVideo.Reaction.UNLIKE: {
      return VideoReactionOptions.UNLIKE
    }
  }
}

export async function processCreateCommentMessage(
  { store, event }: EventContext & StoreContext,
  memberId: MemberId,
  message: ICreateComment
): Promise<void> {
  // in case of null `parentCommentId` protobuf would assign it a default value i.e. ''
  const { videoId, parentCommentId, body } = message
  const eventTime = new Date(event.blockTimestamp)

  // load video
  const video = await getVideo(store, videoId.toString(), ['channel', 'channel.bannedMembers'])

  // ensure member is not banned from channel
  if (video.channel.bannedMembers.includes(new Membership({ id: memberId.toString() }))) {
    return inconsistentState(
      'Cannot add comment; member is banned from participating on any video of the channelId: ',
      video.channel.id
    )
  }

  // ensure video's comment section is enabled
  if (!video.isCommentSectionEnabled) {
    return inconsistentState('Cannot add comment; comment section of this video is disabled, videoId: ', video.id)
  }

  // if new comment is replying to some parent comment, 1. validate that comment existence,
  //  2. set `parentComment` to the parent comment, otherwise set `parentComment` to undefined
  const parentComment =
    parentCommentId && parentCommentId !== '' ? await getComment(store, parentCommentId.toString()) : undefined

  // increment video's comment count
  ++video.commentsCount
  video.updatedAt = eventTime
  await store.save<Video>(video)

  // increment parent comment's replies count
  if (parentComment) {
    ++parentComment.repliesCount
    parentComment.updatedAt = eventTime
    await store.save<Comment>(parentComment)
  }

  const comment = new Comment({
    id: newMetaprotocolEntityId(event),
    createdAt: eventTime,
    updatedAt: eventTime,
    text: body,
    video,
    status: CommentStatus.VISIBLE,
    author: new Membership({ id: memberId.toString() }),
    parentComment,
    repliesCount: 0,
  })
  await store.save<Comment>(comment)

  const commentCreatedEvent = new CommentCreatedEvent({
    ...genericEventFields(event),
    comment,
    text: body,
  })
  await store.save<CommentCreatedEvent>(commentCreatedEvent)

  // emit log event
  logger.info(`New comment has been added by the member: ${memberId} to the video: ${videoId}`)
}

export async function processEditCommentMessage(
  { store, event }: EventContext & StoreContext,
  memberId: MemberId,
  message: IEditComment
): Promise<void> {
  const { videoId, commentId, newBody } = message
  const eventTime = new Date(event.blockTimestamp)

  // load video
  const video = await getVideo(store, videoId.toString(), ['channel', 'channel.bannedMembers'])

  // ensure member is not banned from channel
  if (video.channel.bannedMembers.includes(new Membership({ id: memberId.toString() }))) {
    return inconsistentState(
      'Cannot edit comment; member is banned from participating on any video of the channelId: ',
      video.channel.id
    )
  }

  // ensure video's comment section is enabled
  if (!video.isCommentSectionEnabled) {
    return inconsistentState('Cannot edit comment; comment section of this video is disabled, videoId: ', video.id)
  }

  // load comment
  const comment = await getComment(store, commentId, ['author'])
  if (!comment) {
    return inconsistentState(`comment not found by id: ${commentId}`)
  }

  // ensure comment is not deleted or moderated (deleted by moderator)
  if (comment.status !== CommentStatus.VISIBLE) {
    return inconsistentState('Comment has been deleted', commentId)
  }

  // ensure comment is being edited by author
  if (comment.author.getId() !== memberId.toString()) {
    return inconsistentState('Only comment author can update the comment', commentId)
  }

  const commentTextUpdatedEvent = new CommentTextUpdatedEvent({
    ...genericEventFields(event),
    comment,
    newText: newBody,
  })
  await store.save<CommentTextUpdatedEvent>(commentTextUpdatedEvent)

  comment.updatedAt = eventTime
  comment.text = newBody

  await store.save<Comment>(comment)
  // emit log event
  logger.info(`Comment with id ${commentId} edited by author: ${memberId}`)
}

export async function processDeleteCommentMessage(
  { store, event }: EventContext & StoreContext,
  memberId: MemberId,
  message: IDeleteComment
): Promise<void> {
  const { videoId, commentId } = message
  const eventTime = new Date(event.blockTimestamp)

  // load video
  const video = await getVideo(store, videoId.toString(), ['channel', 'channel.bannedMembers'])

  // ensure member is not banned from channel
  if (video.channel.bannedMembers.includes(new Membership({ id: memberId.toString() }))) {
    return inconsistentState(
      'Cannot delete comment; member is banned from participating on any video of the channelId: ',
      video.channel.id
    )
  }

  // ensure video's comment section is enabled
  if (!video.isCommentSectionEnabled) {
    return inconsistentState('Cannot delete comment; comment section of this video is disabled, videoId: ', video.id)
  }

  // load comment
  const comment = await getComment(store, commentId, ['author', 'comment'])
  if (!comment) {
    return inconsistentState(`comment not found by id: ${commentId}`)
  }

  // ensure comment is not already deleted or moderated (deleted by moderator)
  if (comment.status !== CommentStatus.VISIBLE) {
    return inconsistentState('Comment has been deleted', commentId)
  }

  // ensure comment is being deleted by author
  if (comment.author.getId() !== memberId.toString()) {
    return inconsistentState('Only comment author can delete the comment', commentId)
  }

  // decrement video's comment count
  --video.commentsCount
  video.updatedAt = eventTime
  await store.save<Video>(video)

  // decrement parent comment's replies count
  const { parentComment } = comment
  if (parentComment) {
    --parentComment.repliesCount
    parentComment.updatedAt = eventTime
    await store.save<Comment>(parentComment)
  }

  const commentDeletedEvent = new CommentDeletedEvent({
    ...genericEventFields(event),
    comment,
  })
  await store.save<CommentDeletedEvent>(commentDeletedEvent)

  comment.updatedAt = eventTime
  comment.text = ''
  comment.status = CommentStatus.DELETED

  await store.save<Comment>(comment)
  // emit log event
  logger.info(`Comment with id ${commentId} deleted by author: ${memberId}`)
}

export async function processDeleteCommentModeratorMessage(
  { store, event }: EventContext & StoreContext,
  channelModeratorId: MemberId,
  channelId: ChannelId,
  message: IDeleteCommentModerator
): Promise<void> {
  const { videoId, commentId, rationale } = message
  const eventTime = new Date(event.blockTimestamp)

  // load video
  const video = await getVideo(store, videoId.toString(), ['channel'])

  // ensure channel owns the video
  if (video.channel.getId() !== channelId.toString()) {
    return inconsistentState('Given video does not belong to the channelId: ', channelId)
  }

  // load comment
  const comment = await getComment(store, commentId, ['video'])

  // ensure comment belongs to the video
  if (comment.video.id !== videoId.toString()) {
    return inconsistentState('comment does not belongs to the videoId: ', videoId)
  }

  // ensure comment is not already deleted or moderated (deleted by moderator)
  if (comment.status !== CommentStatus.VISIBLE) {
    return inconsistentState('Comment has been deleted', commentId)
  }

  // decrement video's comment count
  --video.commentsCount
  video.updatedAt = eventTime
  await store.save<Video>(video)

  // decrement parent comment's replies count
  const { parentComment } = comment
  if (parentComment) {
    --parentComment.repliesCount
    parentComment.updatedAt = eventTime
    await store.save<Comment>(parentComment)
  }

  const commentDeletedByModeratorEvent = new CommentDeletedByModeratorEvent({
    ...genericEventFields(event),
    comment,
    actor: new Membership({ id: channelModeratorId.toString() }),
    rationale,
  })
  await store.save<CommentDeletedByModeratorEvent>(commentDeletedByModeratorEvent)

  comment.updatedAt = eventTime
  comment.text = ''
  comment.status = CommentStatus.MODERATED

  await store.save<Comment>(comment)
  // emit log event
  logger.info(`Comment with id ${commentId} deleted by moderator: ${channelModeratorId}`)
}

export async function processPinOrUnpinCommentMessage(
  { store, event }: EventContext & StoreContext,
  channelOwnerId: MemberId,
  channelId: ChannelId,
  message: IPinOrUnpinComment
): Promise<void> {
  const { videoId, commentId, option } = message
  const eventTime = new Date(event.blockTimestamp)

  // load video
  const video = await getVideo(store, videoId.toString(), ['channel'])

  // load comment
  const comment = await getComment(store, commentId)

  // ensure channel owns the video
  if (video.channel.getId() !== channelId.toString()) {
    return inconsistentState('Cannot add comment; comment section is disables for videoId: ', videoId)
  }

  // ensure comment belongs to the video
  if (comment.video.id !== videoId.toString()) {
    return inconsistentState('Cannot add comment; comment section is disables for videoId: ', videoId)
  }

  // ensure comment is not deleted or moderated (deleted by moderator)
  if (comment.status !== CommentStatus.VISIBLE) {
    return inconsistentState('Comment has been deleted', commentId)
  }

  // skipping channel owner validation needed to pin the comment, since that is
  // being performed by joystream runtime in `channel_owner_remarked` extrinsic

  const commentPinnedEvent = new CommentPinnedEvent({
    ...genericEventFields(event),
    comment,
  })
  await store.save<CommentPinnedEvent>(commentPinnedEvent)

  // pin comment on video; if comment is already pinned it remains pinned
  if (option === PinOrUnpinComment.Option.PIN) {
    video.pinnedComment = comment
  }

  // unpin comment from video; if comment is already not pinned, it remains not pinned
  if (option === PinOrUnpinComment.Option.UNPIN) {
    video.pinnedComment = undefined
  }

  video.updatedAt = eventTime
  await store.save<Video>(video)
}

export async function processBanOrUnbanMemberFromChannelMessage(
  { store, event }: EventContext & StoreContext,
  channelOwnerId: MemberId,
  channelId: ChannelId,
  message: IBanOrUnbanMemberFromChannel
): Promise<void> {
  const { memberId, option } = message
  const eventTime = new Date(event.blockTimestamp)

  // load channel
  const channel = await getChannel(store, channelId.toString(), ['bannedMembers'])

  // no events here?

  // ban member from channel; if member is already banned it remains banned
  if (option === BanOrUnbanMemberFromChannel.Option.BAN) {
    channel.bannedMembers.push(new Membership({ id: memberId.toString() }))
  }

  // unban member from channel; if member is already unbanned it remains banned
  if (option === BanOrUnbanMemberFromChannel.Option.UNBAN) {
    const updatedBannedMemberList = channel.bannedMembers.filter(
      (member) => member !== new Membership({ id: memberId.toString() })
    )
    channel.bannedMembers = updatedBannedMemberList
  }

  channel.updatedAt = eventTime
  await store.save<Channel>(channel)
}

export async function processEnableOrDisableCommentSectionOfVideoMessage(
  { store, event }: EventContext & StoreContext,
  channelOwnerId: MemberId,
  channelId: ChannelId,
  message: IEnableOrDisableCommentSectionOfVideo
): Promise<void> {
  const { videoId, option } = message
  const eventTime = new Date(event.blockTimestamp)

  // load video
  const video = await getVideo(store, videoId.toString(), ['channel'])

  // ensure channel owns the video
  if (video.channel.getId() !== channelId.toString()) {
    return inconsistentState(
      `Cannot change comment section settings. Given videoId ${videoId} does not belong to the channelId ${channelId}`
    )
  }

  // enable comments on video; if comments are already enabled it remains as it is.
  if (option === EnableOrDisableCommentSectionOfVideo.Option.ENABLE) {
    video.isCommentSectionEnabled = true
  }

  // disable comments on video; if comments are already disabled it remains as it is.
  if (option === EnableOrDisableCommentSectionOfVideo.Option.DISABLE) {
    video.isCommentSectionEnabled = false
  }

  video.updatedAt = eventTime
  await store.save<Video>(video)
}

export async function processEnableOrDisableReactionsOnVideoMessage(
  { store, event }: EventContext & StoreContext,
  channelOwnerId: MemberId,
  channelId: ChannelId,
  message: IEnableOrDisableReactionsOnVideo
): Promise<void> {
  const { videoId, option } = message
  const eventTime = new Date(event.blockTimestamp)

  // load video
  const video = await getVideo(store, videoId.toString(), ['channel'])

  // ensure channel owns the video
  if (video.channel.getId() !== channelId.toString()) {
    return inconsistentState(
      `Cannot change comment section settings. Given videoId ${videoId} does not belong to the channelId ${channelId}`
    )
  }

  // enable reactions on video; if reactions are already enabled it remains as it is.
  if (option === EnableOrDisableReactionsOnVideo.Option.ENABLE) {
    video.isCommentSectionEnabled = true
  }

  // disable reactions on video; if reactions are already disabled it remains as it is.
  if (option === EnableOrDisableReactionsOnVideo.Option.DISABLE) {
    video.isCommentSectionEnabled = false
  }

  video.updatedAt = eventTime
  await store.save<Video>(video)
}

async function getChannel(store: DatabaseManager, channelId: string, relations?: string[]): Promise<Channel> {
  const channel = await store.get(Channel, { where: { id: channelId }, relations })
  if (!channel) {
    throw new Error(`Channel not found by id: ${channelId}`)
  }
  return channel
}

async function getVideo(store: DatabaseManager, videoId: string, relations?: string[]): Promise<Video> {
  const video = await store.get(Video, { where: { id: videoId }, relations })
  if (!video) {
    throw new Error(`Video not found by id: ${videoId}`)
  }
  return video
}

async function getComment(store: DatabaseManager, commentId: string, relations?: string[]): Promise<Comment> {
  const comment = await store.get(Comment, { where: { id: commentId }, relations })
  if (!comment) {
    throw new Error(`Video comment not found by id: ${commentId}`)
  }
  return comment
}
