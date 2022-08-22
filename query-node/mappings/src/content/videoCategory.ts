import { VideoCategory } from 'query-node/dist/model'
import { invalidMetadata, logger } from '../common'
import { DatabaseManager, SubstrateEvent } from '@joystream/hydra-common'
import { ICreateVideoCategory } from '@joystream/metadata-protobuf'

export async function createVideoCategory(
  store: DatabaseManager,
  event: SubstrateEvent,
  categoryData: ICreateVideoCategory
): Promise<VideoCategory> {
  const videoCategoryId = await getNewCategoryId(store, event)

  let parentCategory: VideoCategory | undefined

  if (categoryData.parentCategoryId) {
    parentCategory = await store.get<VideoCategory>(VideoCategory, { where: { id: categoryData.parentCategoryId } })

    if (!parentCategory) {
      invalidMetadata('Non-existing parent video category request', categoryData.parentCategoryId)
    }
  }

  // create new video category
  const videoCategory = new VideoCategory({
    // main data
    id: videoCategoryId,
    name: categoryData.name,
    description: categoryData.description ?? undefined,
    parentCategory: parentCategory,

    videos: [],
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

async function getNewCategoryId(store: DatabaseManager, event: SubstrateEvent): Promise<string> {
  let categoryId = `${event.blockNumber}-${event.indexInBlock}`
  let tries = 0

  // make sure category id is unique
  while (await store.get<VideoCategory>(VideoCategory, { where: { id: categoryId } })) {
    tries++
    categoryId = `${event.blockNumber}-${event.indexInBlock}-${tries}`
  }

  return categoryId
}
