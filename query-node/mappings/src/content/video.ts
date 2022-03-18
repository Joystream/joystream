/*
eslint-disable @typescript-eslint/naming-convention
*/
import { EventContext, StoreContext } from '@joystream/hydra-common'
import { In } from 'typeorm'
import { Content } from '../../generated/types'
import { deserializeMetadata, inconsistentState, logger } from '../common'
import {
  processVideoMetadata,
  getVideoActiveStatus,
  updateVideoActiveCounters,
  videoRelationsForCountersBare,
  videoRelationsForCounters,
} from './utils'
import { Channel, Video, VideoCategory } from 'query-node/dist/model'
import { VideoMetadata, VideoCategoryMetadata } from '@joystream/metadata-protobuf'
import { integrateMeta } from '@joystream/metadata-protobuf/utils'
import _ from 'lodash'
import { createNft } from './nft'

export async function content_VideoCategoryCreated({ store, event }: EventContext & StoreContext): Promise<void> {
  // read event data
  const [, videoCategoryId, videoCategoryCreationParameters] = new Content.VideoCategoryCreatedEvent(event).params

  // read metadata
  const metadata = (await deserializeMetadata(VideoCategoryMetadata, videoCategoryCreationParameters.meta)) || {}

  // create new video category
  const videoCategory = new VideoCategory({
    // main data
    id: videoCategoryId.toString(),
    videos: [],
    createdInBlock: event.blockNumber,
    activeVideosCounter: 0,

    // fill in auto-generated fields
    createdAt: new Date(event.blockTimestamp),
    updatedAt: new Date(event.blockTimestamp),
  })
  integrateMeta(videoCategory, metadata, ['name'])

  // save video category
  await store.save<VideoCategory>(videoCategory)

  // emit log event
  logger.info('Video category has been created', { id: videoCategoryId })
}

export async function content_VideoCategoryUpdated({ store, event }: EventContext & StoreContext): Promise<void> {
  // read event data
  const [, videoCategoryId, videoCategoryUpdateParameters] = new Content.VideoCategoryUpdatedEvent(event).params

  // load video category
  const videoCategory = await store.get(VideoCategory, {
    where: { id: videoCategoryId.toString() },
  })

  // ensure video category exists
  if (!videoCategory) {
    return inconsistentState('Non-existing video category update requested', videoCategoryId)
  }

  // read metadata
  const newMeta = deserializeMetadata(VideoCategoryMetadata, videoCategoryUpdateParameters.new_meta) || {}
  integrateMeta(videoCategory, newMeta, ['name'])

  // set last update time
  videoCategory.updatedAt = new Date(event.blockTimestamp)

  // save video category
  await store.save<VideoCategory>(videoCategory)

  // emit log event
  logger.info('Video category has been updated', { id: videoCategoryId })
}

export async function content_VideoCategoryDeleted({ store, event }: EventContext & StoreContext): Promise<void> {
  // read event data
  const [, videoCategoryId] = new Content.VideoCategoryDeletedEvent(event).params

  // load video category
  const videoCategory = await store.get(VideoCategory, {
    where: { id: videoCategoryId.toString() },
  })

  // ensure video category exists
  if (!videoCategory) {
    return inconsistentState('Non-existing video category deletion requested', videoCategoryId)
  }

  // remove video category
  await store.remove<VideoCategory>(videoCategory)

  // emit log event
  logger.info('Video category has been deleted', { id: videoCategoryId })
}

/// //////////////// Video //////////////////////////////////////////////////////

export async function content_VideoCreated(ctx: EventContext & StoreContext): Promise<void> {
  const { store, event } = ctx
  // read event data
  const [, channelId, videoId, videoCreationParameters] = new Content.VideoCreatedEvent(event).params

  // load channel
  const channel = await store.get(Channel, {
    where: { id: channelId.toString() },
    relations: ['category'],
  })

  // ensure channel exists
  if (!channel) {
    return inconsistentState('Trying to add video to non-existing channel', channelId)
  }

  const video = new Video({
    id: videoId.toString(),
    channel,
    isCensored: false,
    isFeatured: false,
    createdInBlock: event.blockNumber,
    createdAt: new Date(event.blockTimestamp),
    updatedAt: new Date(event.blockTimestamp),
  })
  // deserialize & process metadata
  if (videoCreationParameters.meta.isSome) {
    const metadata = deserializeMetadata(VideoMetadata, videoCreationParameters.meta.unwrap()) || {}
    await processVideoMetadata(ctx, video, metadata, videoCreationParameters.assets.unwrapOr(undefined))
  }

  // save video
  await store.save<Video>(video)

  if (videoCreationParameters.auto_issue_nft.isSome) {
    const issuanceParameters = videoCreationParameters.auto_issue_nft.unwrap()

    await createNft(store, video, issuanceParameters, event.blockNumber)
  }

  // update video active counters (if needed)
  const videoActiveStatus = getVideoActiveStatus(video)
  if (videoActiveStatus.isFullyActive) {
    await updateVideoActiveCounters(store, undefined, videoActiveStatus)
  }

  // emit log event
  logger.info('Video has been created', { id: videoId })
}

export async function content_VideoUpdated(ctx: EventContext & StoreContext): Promise<void> {
  const { event, store } = ctx
  // read event data
  const [, videoId, videoUpdateParameters] = new Content.VideoUpdatedEvent(event).params

  // load video
  const video = await store.get(Video, {
    where: { id: videoId.toString() },
    relations: [...videoRelationsForCounters, 'license'],
  })

  // ensure video exists
  if (!video) {
    return inconsistentState('Non-existing video update requested', videoId)
  }

  // remember if video is fully active before update
  const initialVideoActiveStatus = getVideoActiveStatus(video)

  // prepare changed metadata
  const newMetadataBytes = videoUpdateParameters.new_meta.unwrapOr(null)

  // update metadata if it was changed
  if (newMetadataBytes) {
    const newMetadata = deserializeMetadata(VideoMetadata, newMetadataBytes) || {}
    await processVideoMetadata(ctx, video, newMetadata, videoUpdateParameters.assets_to_upload.unwrapOr(undefined))
  }

  // create nft
  const issuanceParameters = videoUpdateParameters.auto_issue_nft.unwrapOr(null)
  const nft = issuanceParameters ? await createNft(store, video, issuanceParameters, event.blockNumber) : undefined

  // update the video
  video.nft = nft
  video.updatedAt = new Date(event.blockTimestamp)

  // save video
  await store.save<Video>(video)

  // update video active counters
  await updateVideoActiveCounters(store, initialVideoActiveStatus, getVideoActiveStatus(video))

  // emit log event
  logger.info('Video has been updated', { id: videoId })
}

export async function content_VideoDeleted({ store, event }: EventContext & StoreContext): Promise<void> {
  // read event data
  const [, videoId] = new Content.VideoDeletedEvent(event).params

  // load video
  const video = await store.get(Video, {
    where: { id: videoId.toString() },
    relations: [...videoRelationsForCountersBare],
  })

  // ensure video exists
  if (!video) {
    return inconsistentState('Non-existing video deletion requested', videoId)
  }

  // remember if video is fully active before update
  const initialVideoActiveStatus = getVideoActiveStatus(video)

  // remove video
  await store.remove<Video>(video)

  // update video active counters (if needed)
  if (initialVideoActiveStatus.isFullyActive) {
    await updateVideoActiveCounters(store, initialVideoActiveStatus, undefined)
  }

  // emit log event
  logger.info('Video has been deleted', { id: videoId })
}

export async function content_VideoCensorshipStatusUpdated({
  store,
  event,
}: EventContext & StoreContext): Promise<void> {
  // read event data
  const [, videoId, isCensored] = new Content.VideoCensorshipStatusUpdatedEvent(event).params

  // load video
  const video = await store.get(Video, {
    where: { id: videoId.toString() },
    relations: [...videoRelationsForCounters],
  })

  // ensure video exists
  if (!video) {
    return inconsistentState('Non-existing video censoring requested', videoId)
  }

  // remember if video is fully active before update
  const initialVideoActiveStatus = getVideoActiveStatus(video)

  // update video
  video.isCensored = isCensored.isTrue

  // set last update time
  video.updatedAt = new Date(event.blockTimestamp)

  // save video
  await store.save<Video>(video)

  // update video active counters
  await updateVideoActiveCounters(store, initialVideoActiveStatus, getVideoActiveStatus(video))

  // emit log event
  logger.info('Video censorship status has been updated', { id: videoId, isCensored: isCensored.isTrue })
}

export async function content_FeaturedVideosSet({ store, event }: EventContext & StoreContext): Promise<void> {
  // read event data
  const [, videoIds] = new Content.FeaturedVideosSetEvent(event).params

  // load old featured videos
  const existingFeaturedVideos = await store.getMany(Video, { where: { isFeatured: true } })

  // comparsion utility
  const isSame = (videoIdA: string) => (videoIdB: string) => videoIdA === videoIdB

  // calculate diff sets
  const videosToRemove = existingFeaturedVideos.filter(
    (existingFV) => !videoIds.map((videoId) => videoId.toString()).some(isSame(existingFV.id))
  )
  const videoIdsToAdd = videoIds.filter(
    (videoId) => !existingFeaturedVideos.map((existingFV) => existingFV.id).some(isSame(videoId.toString()))
  )

  // mark previously featured videos as not-featured
  await Promise.all(
    videosToRemove.map(async (video) => {
      video.isFeatured = false
      // set last update time
      video.updatedAt = new Date(event.blockTimestamp)

      await store.save<Video>(video)
    })
  )

  // read previously not-featured videos that are meant to be featured
  const videosToAdd = await store.getMany(Video, {
    where: {
      id: In(videoIdsToAdd.map((item) => item.toString())),
    },
  })

  if (videosToAdd.length !== videoIdsToAdd.length) {
    // Do not throw, as this is not validated by the runtime
    console.warn(
      'Non-existing video(s) in featuredVideos set:',
      _.difference(
        videoIdsToAdd.map((v) => v.toString()),
        videosToAdd.map((v) => v.id)
      )
    )
  }

  // mark previously not-featured videos as featured
  await Promise.all(
    videosToAdd.map(async (video) => {
      video.isFeatured = true

      // set last update time
      video.updatedAt = new Date(event.blockTimestamp)

      await store.save<Video>(video)
    })
  )

  // emit log event
  const addedVideoIds = videosToAdd.map((v) => v.id)
  const removedVideoIds = videosToRemove.map((v) => v.id)
  logger.info('Featured videos have been updated', { addedVideoIds, removedVideoIds })
}
