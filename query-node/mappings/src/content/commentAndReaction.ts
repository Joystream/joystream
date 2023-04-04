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
import { ChannelId, MemberId } from '@joystream/types/primitives'
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
import { genericEventFields, inconsistentState, newMetaprotocolEntityId, unexpectedData } from '../common'

// TODO: Ensure video is actually a video
// TODO: make sure comment is fully removed (all of its reactions)
// TODO: make sure video is fully removed (all of its comments & reactions)

async function getChannel(store: DatabaseManager, channelId: string, relations?: string[]): Promise<Channel> {
  const channel = await store.get(Channel, { where: { id: channelId }, relations })
  if (!channel) {
    inconsistentState(`Channel not found by id: ${channelId}`)
  }
  return channel
}

async function getVideo(store: DatabaseManager, videoId: string, relations?: string[]): Promise<Video> {
  const video = await store.get(Video, { where: { id: videoId }, relations })
  if (!video) {
    inconsistentState(`Video not found by id: ${videoId}`)
  }
  return video
}

async function getComment(store: DatabaseManager, commentId: string, relations?: string[]): Promise<Comment> {
  const comment = await store.get(Comment, { where: { id: commentId }, relations })
  if (!comment) {
    inconsistentState(`Video comment not found by id: ${commentId}`)
  }
  return comment
}

function ensureMemberIsNotBannedFromChannel(channel: Channel, memberId: string, errorMessage: string) {
  if (channel.bannedMembers.includes(new Membership({ id: memberId }))) {
    inconsistentState(`${errorMessage}; member is banned from participating on content of channelId: `, channel.id)
  }
}

function ensureReactionFeatureIsEnabled(video: Video) {
  if (!video.isReactionFeatureEnabled) {
    inconsistentState('Cannot add reaction; reaction feature is disabled on video: ', video.id)
  }
}

function ensureCommentSectionIsEnabled(video: Video, errorMessage: string) {
  if (!video.isCommentSectionEnabled) {
    inconsistentState(`${errorMessage}; comment section is disabled on video: `, video.id)
  }
}

function ensureCommentAuthor(comment: Comment, authorId: string, errorMessage: string) {
  if (comment.author.id !== authorId) {
    inconsistentState(errorMessage, comment.id)
  }
}

function ensureCommentIsNotDeleted(comment: Comment) {
  if (comment.status !== CommentStatus.VISIBLE) {
    inconsistentState('Comment has been deleted', comment.id)
  }
}
function ensureChannelOwnsTheVideo(video: Video, channelId: string, errorMessage: string) {
  if (video.channel.id !== channelId) {
    inconsistentState(`${errorMessage}; video does not belong to the channelId: `, channelId)
  }
}

function videoReactionEntityId(idSegments: { memberId: MemberId; videoId: string }) {
  const { memberId, videoId } = idSegments
  return `${memberId}-${videoId}`
}

function commentReactionEntityId(idSegments: { memberId: MemberId; commentId: string; reactionId: number }) {
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
  const reactionsCountByReactionId = await store.get(CommentReactionsCountByReactionId, {
    where: { id: `${comment.id}-${reactionId}` },
  })

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
  memberId: MemberId,
  metadata: DecodedMetadataObject<IReactVideo>
): Promise<void> {
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
  const video = await getVideo(store, videoId.toString(), ['channel', 'channel.bannedMembers'])

  // ensure member is not banned from channel
  ensureMemberIsNotBannedFromChannel(video.channel, memberId.toString(), 'Cannot add reaction')

  // ensure reaction feature is enabled on the video
  ensureReactionFeatureIsEnabled(video)

  // load previous reaction by member to the video (if any)
  const previousReactionByMember = await store.get(VideoReaction, {
    where: { id: videoReactionEntityId({ memberId, videoId: videoId.toString() }) },
  })

  // load video reaction count by reaction type (LIKE/UNLIKE)
  const reactionsCountByReactionType = await getOrCreateVideoReactionsCountByReactionId(store, video, reactionResult)

  if (previousReactionByMember) {
    await changeOrRemovePreviousReaction(store, video, previousReactionByMember, reactionResult)
  } else {
    // new reaction
    const newReactionByMember = new VideoReaction({
      id: videoReactionEntityId({ memberId, videoId: videoId.toString() }),
      video,
      reaction: reactionResult,
      memberId: memberId.toString(),
      member: new Membership({ id: memberId.toString() }),
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
    reactingMember: new Membership({ id: memberId.toString() }),
    reactionResult,
  })

  await store.save<VideoReactedEvent>(videoReactedEvent)
}

export async function processReactCommentMessage(
  store: DatabaseManager,
  event: SubstrateEvent,
  memberId: MemberId,
  metadata: DecodedMetadataObject<IReactComment>
): Promise<void> {
  const { commentId, reactionId } = metadata

  // load comment
  const comment = await getComment(store, commentId, ['video', 'video.channel', 'video.channel.bannedMembers'])
  const { video } = comment

  // ensure member is not banned from channel
  ensureMemberIsNotBannedFromChannel(video.channel, memberId.toString(), 'Cannot add reaction')

  // load same reaction by member to the comment (if any)
  const previousReactionByMember = await store.get(CommentReaction, {
    where: { id: commentReactionEntityId({ memberId, commentId, reactionId }) },
  })

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
      id: commentReactionEntityId({ memberId, commentId, reactionId }),
      comment,
      reactionId,
      video,
      memberId: memberId.toString(),
      member: new Membership({ id: memberId.toString() }),
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
    reactingMember: new Membership({ id: memberId.toString() }),
    reactionResult: reactionId,
  })

  await store.save<CommentReactedEvent>(commentReactedEvent)
}

export async function processCreateCommentMessage(
  store: DatabaseManager,
  event: SubstrateEvent,
  memberId: MemberId,
  metadata: DecodedMetadataObject<ICreateComment>
): Promise<Comment> {
  const { videoId, parentCommentId, body } = metadata

  // load video
  const video = await getVideo(store, videoId.toString(), ['channel', 'channel.bannedMembers'])
  const { channel } = video

  // ensure member is not banned from channel
  ensureMemberIsNotBannedFromChannel(channel, memberId.toString(), 'Cannot add comment')

  // ensure video's comment section is enabled
  ensureCommentSectionIsEnabled(video, 'Cannot add comment')

  // if new comment is replying to some parent comment, 1. validate that comment existence,
  //  2. set `parentComment` to the parent comment, otherwise set `parentComment` to undefined
  const parentComment = parentCommentId
    ? await getComment(store, parentCommentId.toString(), ['author', 'video'])
    : undefined

  if (parentComment && parentComment.video.id !== videoId.toString()) {
    inconsistentState(`Cannot add comment. parent comment ${parentComment.id} does not exist on video ${videoId}`)
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
    author: new Membership({ id: memberId.toString() }),
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
  memberId: MemberId,
  metadata: DecodedMetadataObject<IEditComment>
): Promise<Comment> {
  const { commentId, newBody } = metadata

  // load comment
  const comment = await getComment(store, commentId, [
    'author',
    'edits',
    'video',
    'video.channel',
    'video.channel.bannedMembers',
  ])
  const { video } = comment

  // ensure member is not banned from channel
  ensureMemberIsNotBannedFromChannel(video.channel, memberId.toString(), 'Cannot edit reaction')

  // ensure video's comment section is enabled
  ensureCommentSectionIsEnabled(video, 'Cannot edit reaction')

  // ensure comment is being edited by author
  ensureCommentAuthor(comment, memberId.toString(), 'Only comment author can update the comment')

  // ensure comment is not deleted or moderated
  ensureCommentIsNotDeleted(comment)

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
  memberId: MemberId,
  metadata: DecodedMetadataObject<IDeleteComment>
): Promise<Comment> {
  const { commentId } = metadata

  // load comment
  const comment = await getComment(store, commentId, [
    'author',
    'parentComment',
    'video',
    'video.channel',
    'video.channel.bannedMembers',
  ])
  const { video, parentComment } = comment

  // ensure member is not banned from channel
  ensureMemberIsNotBannedFromChannel(video.channel, memberId.toString(), 'Cannot delete comment')

  // ensure video's comment section is enabled
  ensureCommentSectionIsEnabled(video, 'Cannot delete comment')

  // ensure comment is being deleted by author
  ensureCommentAuthor(comment, memberId.toString(), 'Only comment author can delete the comment')

  // ensure comment is not already deleted or moderated
  ensureCommentIsNotDeleted(comment)

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
  channelOwnerOrModerator: typeof ContentActor,
  channelId: ChannelId,
  message: IModerateComment
): Promise<Comment> {
  const { commentId, rationale } = message

  // load comment
  const comment = await getComment(store, commentId, ['parentComment', 'video', 'video.channel'])
  const { video, parentComment } = comment

  // ensure channel owns the video
  ensureChannelOwnsTheVideo(video, channelId.toString(), 'Cannot moderate comment on video')

  // ensure comment is not already deleted or moderated
  ensureCommentIsNotDeleted(comment)

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
    actor: channelOwnerOrModerator,
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
  channelId: ChannelId,
  message: IPinOrUnpinComment
): Promise<void> {
  const { commentId, option } = message

  // load comment
  const comment = await getComment(store, commentId, ['video', 'video.channel'])
  const { video } = comment

  // ensure channel owns the video
  ensureChannelOwnsTheVideo(video, channelId.toString(), 'Cannot pin/unpin comment on video')

  // ensure comment is not deleted or moderated
  ensureCommentIsNotDeleted(comment)

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
}

export async function processBanOrUnbanMemberFromChannelMessage(
  store: DatabaseManager,
  event: SubstrateEvent,
  channelId: ChannelId,
  message: IBanOrUnbanMemberFromChannel
): Promise<void> {
  const { memberId, option } = message

  // load channel
  const channel = await getChannel(store, channelId.toString(), ['bannedMembers'])

  const member = await store.get(Membership, { where: { id: memberId.toString() } })
  if (!member) {
    // Error will be caught inside `content_ChannelOwnerRemarked`
    unexpectedData(`Member by id '${memberId.toString()}' not found!`)
  }

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

  await store.save<Channel>(channel)

  // common event processing

  const memberBannedFromChannelEvent = new MemberBannedFromChannelEvent({
    ...genericEventFields(event),
    channel,
    member: new Membership({ id: memberId.toString() }),
    action: option === BanOrUnbanMemberFromChannel.Option.BAN,
  })

  await store.save<MemberBannedFromChannelEvent>(memberBannedFromChannelEvent)
}

export async function processVideoReactionsPreferenceMessage(
  store: DatabaseManager,
  event: SubstrateEvent,
  channelId: ChannelId,
  message: IVideoReactionsPreference
): Promise<void> {
  const { videoId, option } = message

  // load video
  const video = await getVideo(store, videoId.toString(), ['channel'])

  // ensure channel owns the video
  ensureChannelOwnsTheVideo(video, channelId.toString(), 'Cannot change video reactions preference')

  video.isCommentSectionEnabled = option === VideoReactionsPreference.Option.ENABLE
  await store.save<Video>(video)

  // common event processing

  const videoReactionsPreferenceEvent = new VideoReactionsPreferenceEvent({
    ...genericEventFields(event),
    video,
    reactionsStatus: option === VideoReactionsPreference.Option.ENABLE,
  })

  await store.save<VideoReactionsPreferenceEvent>(videoReactionsPreferenceEvent)
}
