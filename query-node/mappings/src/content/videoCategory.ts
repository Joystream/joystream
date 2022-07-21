import { VideoCategory } from 'query-node/dist/model'
import { inconsistentState, logger } from '../common'
import { DatabaseManager, SubstrateEvent } from '@joystream/hydra-common'
import { generateNextId } from '@joystream/hydra-processor/lib/executor/EntityIdGenerator'

export async function createVideoCategory(
  store: DatabaseManager,
  event: SubstrateEvent,
  name: string
): Promise<VideoCategory> {
  const videoCategoryId = await generateNextId(store, VideoCategory)

  // create new video category
  const videoCategory = new VideoCategory({
    // main data
    id: videoCategoryId,

    videos: [],
    name,
    createdInBlock: event.blockNumber,
    activeVideosCounter: 0,

    // fill in auto-generated fields
    createdAt: new Date(event.blockTimestamp),
    updatedAt: new Date(event.blockTimestamp),
  })

  // save video category
  await store.save<VideoCategory>(videoCategory)

  // emit log event
  logger.info('Video category has been created', { id: videoCategory.id })

  return videoCategory
}

export async function updateVideoCategory(
  store: DatabaseManager,
  event: SubstrateEvent,
  videoCategoryId: string,
  name: string
): Promise<VideoCategory> {
  // load video category
  const videoCategory = await store.get(VideoCategory, {
    where: { id: videoCategoryId },
  })

  // ensure video category exists
  if (!videoCategory) {
    return inconsistentState('Non-existing video category update requested', videoCategoryId)
  }

  videoCategory.name = name

  // set last update time
  videoCategory.updatedAt = new Date(event.blockTimestamp)

  // save video category
  await store.save<VideoCategory>(videoCategory)

  // emit log event
  logger.info('Video category has been updated', { id: videoCategoryId })

  return videoCategory
}

export async function deleteVideoCategory(
  store: DatabaseManager,
  event: SubstrateEvent,
  videoCategoryId: string
): Promise<VideoCategory> {
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

  return videoCategory
}
