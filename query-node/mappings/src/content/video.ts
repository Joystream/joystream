import { SubstrateEvent } from '@dzlzv/hydra-common'
import { DatabaseManager } from '@dzlzv/hydra-db-utils'

import {
  Content,
} from '../../../generated/types'

import {
  inconsistentState,
  prepareBlock,
} from '../common'

import { readProtobuf } from './utils'

// primary entities
import { CuratorGroup } from 'query-node/src/modules/curator-group/curator-group.model'
import { Video } from 'query-node/src/modules/video/video.model'
import { VideoCategory } from 'query-node/src/modules/video-category/video-category.model'

// secondary entities
import { License } from 'query-node/src/modules/license/license.model'

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function content_VideoCategoryCreated(
  db: DatabaseManager,
  event: SubstrateEvent
) {
  // read event data
  const {videoCategoryId, videoCategoryCreationParameters} = new Content.VideoCategoryCreatedEvent(event).data

  // read metadata
  const protobufContent = readProtobuf(
    new VideoCategory(),
    videoCategoryCreationParameters.meta,
    [],
    db,
    event
  )

  // create new video category
  const videoCategory = new VideoCategory({
    id: videoCategoryId.toString(), // ChannelId
    isCensored: false,
    videos: [],
    happenedIn: await prepareBlock(db, event),
    ...Object(protobufContent)
  })

  // save video category
  await db.save<VideoCategory>(videoCategory)
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function content_VideoCategoryUpdated(
  db: DatabaseManager,
  event: SubstrateEvent
) {
  // read event data
  const {videoCategoryId, videoCategoryUpdateParameters} = new Content.VideoCategoryUpdatedEvent(event).data

  // load video category
  const videoCategory = await db.get(VideoCategory, { where: { id: videoCategoryId } })

  // ensure video category exists
  if (!videoCategory) {
    return inconsistentState()
  }

  // read metadata
  const protobufContent = await readProtobuf(
    new VideoCategory(),
    videoCategoryUpdateParameters.new_meta,
    [],
    db,
    event,
  )

  // update all fields read from protobuf
  for (let [key, value] of Object(protobufContent).entries()) {
    videoCategory[key] = value
  }

  // save video category
  await db.save<VideoCategory>(videoCategory)
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function content_VideoCategoryDeleted(
  db: DatabaseManager,
  event: SubstrateEvent
) {
  // read event data
  const {videoCategoryId} = new Content.VideoCategoryDeletedEvent(event).data

  // load video category
  const videoCategory = await db.get(VideoCategory, { where: { id: videoCategoryId } })

  // ensure video category exists
  if (!videoCategory) {
    return inconsistentState()
  }

  // remove video category
  await db.remove<VideoCategory>(videoCategory)
}

/////////////////// Video //////////////////////////////////////////////////////

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function content_VideoCreated(
  db: DatabaseManager,
  event: SubstrateEvent
) {
  // read event data
  const {channelId, videoId, videoCreationParameters} = new Content.VideoCreatedEvent(event).data

  // read metadata
  const protobufContent = await readProtobuf(
    new Video(),
    videoCreationParameters.meta,
    videoCreationParameters.assets,
    db,
    event,
  )

  // create new video
  const video = new Video({
    id: videoId,
    isCensored: false,
    channel: channelId,
    happenedIn: await prepareBlock(db, event),
    ...Object(protobufContent)
  })

  // save video
  await db.save<Video>(video)
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function content_VideoUpdated(
  db: DatabaseManager,
  event: SubstrateEvent
) {
  // read event data
  const {videoId, videoUpdateParameters} = new Content.VideoUpdatedEvent(event).data

  // load video
  const video = await db.get(Video, { where: { id: videoId } })

  // ensure video exists
  if (!video) {
    return inconsistentState()
  }

  // update metadata if it changed
  if (videoUpdateParameters.new_meta.isSome) {
    const protobufContent = await readProtobuf(
      new Video(),
      videoUpdateParameters.new_meta.unwrap(), // TODO: is there any better way to get value without unwrap?
      videoUpdateParameters.assets.unwrapOr([]),
      db,
      event,
    )

    // remember original license
    const originalLicense = video.license

    // update all fields read from protobuf
    for (let [key, value] of Object(protobufContent).entries()) {
      video[key] = value
    }

    // license has changed - delete old license
    if (originalLicense && video.license != originalLicense) {
      await db.remove<License>(originalLicense)
    }
  }

  // TODO: handle situation when only assets changed

  // save video
  await db.save<Video>(video)
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function content_VideoDeleted(
  db: DatabaseManager,
  event: SubstrateEvent
) {
  // read event data
  const {videoId} = new Content.VideoDeletedEvent(event).data

  // load video
  const video = await db.get(Video, { where: { id: videoId } })

  // ensure video exists
  if (!video) {
    return inconsistentState()
  }

  // remove video
  await db.remove<Video>(video)
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function content_VideoCensored(
  db: DatabaseManager,
  event: SubstrateEvent
) {
  // read event data
  const {videoId} = new Content.VideoCensoredEvent(event).data

  // load video
  const video = await db.get(Video, { where: { id: videoId } })

  // ensure video exists
  if (!video) {
    return inconsistentState()
  }

  // update video
  video.isCensored = true;

  // save video
  await db.save<Video>(video)
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function content_VideoUncensored(
  db: DatabaseManager,
  event: SubstrateEvent
) {
  // read event data
  const {videoId} = new Content.VideoUncensoredEvent(event).data

  // load video
  const video = await db.get(Video, { where: { id: videoId } })

  // ensure video exists
  if (!video) {
    return inconsistentState()
  }

  // update video
  video.isCensored = false;

  // save video
  await db.save<Video>(video)
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function content_FeaturedVideosSet(
  db: DatabaseManager,
  event: SubstrateEvent
) {
  // read event data
  const {videoId: videoIds} = new Content.FeaturedVideosSetEvent(event).data

  // load old featured videos
  const existingFeaturedVideos = await db.getMany(Video, { where: { isFeatured: true } })

  // comparsion utility
  const isSame = (videoIdA: string) => (videoIdB: string) => videoIdA == videoIdB

  // calculate diff sets
  const toRemove = existingFeaturedVideos.filter(existingFV =>
    !videoIds
      .map(item => item.toHex())
      .some(isSame(existingFV.id))
  )
  const toAdd = videoIds.filter(video =>
    !existingFeaturedVideos
      .map(item => item.id)
      .some(isSame(video.toHex()))
  )

  // mark previously featured videos as not-featured
  for (let video of toRemove) {
    video.isFeatured = false;

    await db.save<Video>(video)
  }

  // escape if no featured video needs to be added
  if (!toAdd) {
    return
  }

  // read videos previously not-featured videos that are meant to be featured
  const videosToAdd = await db.getMany(Video, { where: { id: [toAdd] } })

  if (videosToAdd.length != toAdd.length) {
    return inconsistentState()
  }

  // mark previously not-featured videos as featured
  for (let video of videosToAdd) {
    video.isFeatured = true;

    await db.save<Video>(video)
  }
}

/////////////////// Curator Group //////////////////////////////////////////////

export async function content_CuratorGroupCreated(
  db: DatabaseManager,
  event: SubstrateEvent
) {
  // read event data
  const {curatorGroupId} = new Content.CuratorGroupCreatedEvent(event).data

  // create new curator group
  const curatorGroup = new CuratorGroup({
    id: curatorGroupId.toString(),
    curatorIds: [],
    isActive: false, // runtime creates inactive curator groups by default
  })

  // save curator group
  await db.save<CuratorGroup>(curatorGroup)
}

export async function content_CuratorGroupStatusSet(
  db: DatabaseManager,
  event: SubstrateEvent
) {
  // read event data
  const {curatorGroupId, bool: isActive} = new Content.CuratorGroupStatusSetEvent(event).data

  // load curator group
  const curatorGroup = await db.get(CuratorGroup, { where: { id: curatorGroupId }})

  // ensure curator group exists
  if (!curatorGroup) {
    return inconsistentState()
  }

  // update curator group
  curatorGroup.isActive = isActive.isTrue

  // save curator group
  await db.save<CuratorGroup>(curatorGroup)
}

export async function content_CuratorAdded(
  db: DatabaseManager,
  event: SubstrateEvent
) {
  // read event data
  const {curatorGroupId, curatorId} = new Content.CuratorAddedEvent(event).data

  // load curator group
  const curatorGroup = await db.get(CuratorGroup, { where: { id: curatorGroupId }})

  // ensure curator group exists
  if (!curatorGroup) {
    return inconsistentState()
  }

  // update curator group
  curatorGroup.curatorIds.push(curatorId)

  // save curator group
  await db.save<CuratorGroup>(curatorGroup)
}

export async function content_CuratorRemoved(
  db: DatabaseManager,
  event: SubstrateEvent
) {
  // read event data
  const {curatorGroupId, curatorId} = new Content.CuratorAddedEvent(event).data

  // load curator group
  const curatorGroup = await db.get(CuratorGroup, { where: { id: curatorGroupId }})

  // ensure curator group exists
  if (!curatorGroup) {
    return inconsistentState()
  }

  const curatorIndex = curatorGroup.curatorIds.indexOf(curatorId)

  // ensure curator group exists
  if (curatorIndex < 0) {
    return inconsistentState()
  }

  // update curator group
  curatorGroup.curatorIds.splice(curatorIndex, 1)

  // save curator group
  await db.save<CuratorGroup>(curatorGroup)
}
