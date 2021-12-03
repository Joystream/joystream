/*
eslint-disable @typescript-eslint/naming-convention
*/
import { EventContext, StoreContext, DatabaseManager } from '@joystream/hydra-common'
import { FindConditions, In, Raw } from 'typeorm'
import {
  createDataObject,
  getWorker,
  getWorkingGroupModuleName,
  inconsistentState,
  logger,
  unexpectedData,
} from './common'
import { DataDirectory } from './generated/types'
import { ContentId, StorageObjectOwner } from '@joystream/types/augment'
import { ContentId as Custom_ContentId } from '@joystream/types/storage'
import { registry } from '@joystream/types'
import {
  Channel,
  Video,
  DataObject,
  DataObjectOwner,
  DataObjectOwnerMember,
  DataObjectOwnerChannel,
  DataObjectOwnerDao,
  DataObjectOwnerCouncil,
  DataObjectOwnerWorkingGroup,
  LiaisonJudgement,
  AssetJoystreamStorage,
} from 'query-node/dist/model'

export async function dataDirectory_ContentAdded(ctx: EventContext & StoreContext): Promise<void> {
  const { event } = ctx
  // read event data
  const [contentParameters, storageObjectOwner] = new DataDirectory.ContentAddedEvent(event).params

  // save all content objects
  for (const parameters of contentParameters) {
    const owner = convertStorageObjectOwner(storageObjectOwner)
    await createDataObject(ctx, parameters, owner)
  }

  // emit log event
  logger.info('Storage content has beed added', {
    ids: contentParameters.map((item) => encodeContentId(item.content_id)),
  })
}

export async function dataDirectory_ContentRemoved({ store, event }: EventContext & StoreContext): Promise<void> {
  // read event data
  const [contentIds] = new DataDirectory.ContentRemovedEvent(event).params

  // load assets
  const dataObjects = await store.getMany(DataObject, {
    where: {
      joystreamContentId: In(contentIds.map((item) => encodeContentId(item))),
    } as FindConditions<DataObject>,
  })

  // store dataObject ids before they are deleted (for logging purposes)
  const dataObjectIds = dataObjects.map((item) => item.id)

  // remove assets from database
  for (const item of dataObjects) {
    // ensure dataObject is nowhere used to prevent db constraint error
    await unsetDataObjectRelations(store, item)

    // remove data object
    await store.remove<DataObject>(item)
  }

  // emit log event
  logger.info('Storage content have been removed', { id: contentIds, dataObjectIds })
}

export async function dataDirectory_ContentAccepted({ store, event }: EventContext & StoreContext): Promise<void> {
  // read event data
  const [contentId, storageProviderId] = new DataDirectory.ContentAcceptedEvent(event).params
  const encodedContentId = encodeContentId(contentId)

  // load asset
  const dataObject = await store.get(DataObject, {
    where: { joystreamContentId: encodedContentId } as FindConditions<DataObject>,
  })

  // ensure object exists
  if (!dataObject) {
    return inconsistentState('Non-existing content acceptation requested', encodedContentId)
  }

  // load storage provider
  const worker = await getWorker(store, 'storageWorkingGroup', storageProviderId)

  // update object
  dataObject.liaison = worker
  dataObject.liaisonJudgement = LiaisonJudgement.ACCEPTED

  // set last update time
  dataObject.updatedAt = new Date(event.blockTimestamp)

  // save object
  await store.save<DataObject>(dataObject)

  // emit log event
  logger.info('Storage content has been accepted', { id: encodedContentId })
}
// TODO: use ON DELETE SET null on database/typeorm level instead?
async function unsetDataObjectRelations(store: DatabaseManager, dataObject: DataObject) {
  const channelAssets = ['avatarPhoto', 'coverPhoto'] as const
  const videoAssets = ['thumbnailPhoto', 'media'] as const

  // TODO: FIXME: Queries to be verified!
  // NOTE: we don't need to retrieve multiple channels/videos via `store.getMany()` because dataObject
  //       is allowed to be associated only with one channel/video in runtime
  const channel = await store.get(Channel, {
    where: channelAssets.map((assetName) => ({
      [assetName]: Raw((alias) => `${alias}::json->'dataObjectId' = :id`, {
        id: dataObject.id,
      }),
    })),
  })
  const video = await store.get(Video, {
    where: videoAssets.map((assetName) => ({
      [assetName]: Raw((alias) => `${alias}::json->'dataObjectId' = :id`, {
        id: dataObject.id,
      }),
    })),
  })

  if (channel) {
    channelAssets.forEach((assetName) => {
      if (channel[assetName] && (channel[assetName] as AssetJoystreamStorage).dataObjectId === dataObject.id) {
        channel[assetName] = undefined
      }
    })
    await store.save<Channel>(channel)

    // emit log event
    logger.info('Content has been disconnected from Channel', {
      channelId: channel.id.toString(),
      joystreamContentId: dataObject.joystreamContentId,
    })
  } else if (video) {
    videoAssets.forEach((assetName) => {
      if (video[assetName] && (video[assetName] as AssetJoystreamStorage).dataObjectId === dataObject.id) {
        video[assetName] = undefined
      }
    })
    await store.save<Video>(video)

    // emit log event
    logger.info('Content has been disconnected from Video', {
      videoId: video.id.toString(),
      joystreamContentId: dataObject.joystreamContentId,
    })
  }
}

/// //////////////// Helpers ////////////////////////////////////////////////////

function convertStorageObjectOwner(objectOwner: StorageObjectOwner): typeof DataObjectOwner {
  if (objectOwner.isMember) {
    const owner = new DataObjectOwnerMember()
    owner.memberId = objectOwner.asMember.toString()

    return owner
  }

  if (objectOwner.isChannel) {
    const owner = new DataObjectOwnerChannel()
    owner.channelId = objectOwner.asChannel.toString()

    return owner
  }

  if (objectOwner.isDao) {
    const owner = new DataObjectOwnerDao()
    owner.dao = objectOwner.asDao.toNumber()

    return owner
  }

  if (objectOwner.isCouncil) {
    return new DataObjectOwnerCouncil()
  }

  if (objectOwner.isWorkingGroup) {
    const owner = new DataObjectOwnerWorkingGroup()
    owner.workingGroupId = getWorkingGroupModuleName(objectOwner.asWorkingGroup)

    return owner
  }

  unexpectedData('Not implemented StorageObjectOwner type', objectOwner.toString())
}

function encodeContentId(contentId: ContentId) {
  const customContentId = new Custom_ContentId(registry, contentId)

  return customContentId.encode()
}
