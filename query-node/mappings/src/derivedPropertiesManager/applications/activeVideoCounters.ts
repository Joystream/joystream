import { DerivedPropertiesManager } from '../classes'
import { IExecutor, IListener, IChangePair } from '../interfaces'
import { DatabaseManager } from '@joystream/hydra-common'
import { Channel, Video, VideoCategory, StorageDataObject } from 'query-node/dist/model'
import { videoRelationsForCounters } from '../../content/utils'

export type IVideoDerivedEntites = 'channel' | 'category'
export type IAvcChange = 1 | -1 | [1 | -1, IVideoDerivedEntites[]]

/*
  Decides if video is considered active.
*/
function isVideoActive(video: Video): boolean {
  return !!video.isPublic && !video.isCensored && !!video.thumbnailPhoto?.isAccepted && !!video.media?.isAccepted
}

/*
  Compares original and updated videos and calculates if video active status changed.
*/
function hasVideoChanged(
  oldValue: Video | undefined,
  newValue: Video | undefined
): IChangePair<IAvcChange> | undefined {
  // at least one video should always exists but due to TS type limitations
  // (can't define at least one-of-two parameters required) this safety condition needs to be here
  if (!oldValue && !newValue) {
    return undefined
  }

  // video is being created?
  if (!oldValue) {
    return {
      old: undefined,
      new: (Number(isVideoActive(newValue as Video)) as IAvcChange) || undefined,
    }
  }

  // video is being deleted?
  if (!newValue) {
    return {
      old: (-Number(isVideoActive(oldValue)) as IAvcChange) || undefined,
      new: undefined,
    }
  }

  // calculate active status
  const originalState = isVideoActive(oldValue)
  const newState = isVideoActive(newValue)

  // escape if no change and video is not active
  if (originalState === newState && !newState) {
    return undefined
  }

  // active status stays unchanged but relation(s) changed, return list of changed relations
  if (originalState === newState) {
    return {
      old: [
        -1,
        [
          oldValue.channel && oldValue.channel.id !== newValue.channel?.id && 'channel',
          oldValue.category && oldValue.category.id !== newValue.category?.id && 'category',
        ].filter((item) => item) as IVideoDerivedEntites[],
      ],
      new: [
        1,
        [
          newValue.channel && oldValue.channel?.id !== newValue.channel.id && 'channel',
          newValue.category && oldValue.category?.id !== newValue.category.id && 'category',
        ].filter((item) => item) as IVideoDerivedEntites[],
      ],
    }
  }

  // calculate change
  const change = Number(newState) - Number(originalState)

  return {
    old: (-change as IAvcChange) || undefined,
    new: (change as IAvcChange) || undefined,
  }
}

/*
  Listener for video events.
*/
class VideoUpdateListener implements IListener<Video, IAvcChange> {
  getRelationDependencies(): string[] {
    return []
  }

  hasValueChanged(oldValue: Video | undefined, newValue: Video): IChangePair<IAvcChange> | undefined
  hasValueChanged(oldValue: Video, newValue: Video | undefined): IChangePair<IAvcChange> | undefined
  hasValueChanged(oldValue: Video, newValue: Video): IChangePair<IAvcChange> | undefined {
    return hasVideoChanged(oldValue, newValue)
  }
}

/*
  Listener for thumbnail photo events.
*/
class StorageDataObjectChangeListener_ThumbnailPhoto implements IListener<StorageDataObject, IAvcChange> {
  getRelationDependencies(): string[] {
    return [
      'videoThumbnail',
      'videoThumbnail.thumbnailPhoto',
      'videoThumbnail.media',
      'videoThumbnail.category',
      'videoThumbnail.channel',
    ]
  }

  hasValueChanged(
    oldValue: StorageDataObject | undefined,
    newValue: StorageDataObject
  ): IChangePair<IAvcChange> | undefined

  hasValueChanged(
    oldValue: StorageDataObject,
    newValue: StorageDataObject | undefined
  ): IChangePair<IAvcChange> | undefined

  hasValueChanged(oldValue: StorageDataObject, newValue: StorageDataObject): IChangePair<IAvcChange> | undefined {
    const oldVideo = oldValue?.videoThumbnail
    const newVideo = newValue?.videoThumbnail

    return hasVideoChanged(oldVideo, newVideo)
  }
}

/*
  Listener for media events.
*/
class StorageDataObjectChangeListener_Media implements IListener<StorageDataObject, IAvcChange> {
  getRelationDependencies(): string[] {
    return ['videoMedia', 'videoMedia.thumbnailPhoto', 'videoMedia.media', 'videoMedia.category', 'videoMedia.channel']
  }

  hasValueChanged(
    oldValue: StorageDataObject | undefined,
    newValue: StorageDataObject
  ): IChangePair<IAvcChange> | undefined

  hasValueChanged(
    oldValue: StorageDataObject,
    newValue: StorageDataObject | undefined
  ): IChangePair<IAvcChange> | undefined

  hasValueChanged(oldValue: StorageDataObject, newValue: StorageDataObject): IChangePair<IAvcChange> | undefined {
    const oldVideo = oldValue?.videoMedia
    const newVideo = newValue?.videoMedia

    return hasVideoChanged(oldVideo as Video, newVideo as Video)
  }
}

/*
  Adapter for generalizing AVC executor.
*/
interface IAvcExecutorAdapter<Entity> {
  (item: Entity): Video
}

/*
  Active video counter executor reflecting changes to channels, channel cateories, or video categories.
*/
class ActiveVideoCounterExecutor<
  Entity extends Video | StorageDataObject,
  DerivedEntity extends VideoCategory | Channel = VideoCategory | Channel
> implements IExecutor<Entity, IAvcChange, DerivedEntity>
{
  private adapter: IAvcExecutorAdapter<Entity>

  constructor(adapter: IAvcExecutorAdapter<Entity>) {
    this.adapter = adapter
  }

  async loadDerivedEntities(store: DatabaseManager, entity: Entity): Promise<DerivedEntity[]> {
    // TODO: find way to reliably decide if channel, etc. are loaded and throw error if not

    const targetEntity = this.adapter(entity)

    // this expects entity has loaded channel, channel category, and video category
    return [targetEntity.channel, targetEntity.category].filter((item) => item) as DerivedEntity[]
  }

  async saveDerivedEntities(store: DatabaseManager, entities: DerivedEntity[]): Promise<void> {
    await Promise.all(entities.map((entity) => store.save(entity)))
  }

  updateOldValue(entity: DerivedEntity, change: IAvcChange): DerivedEntity {
    entity = this.updateValueCommon(entity, change)

    return entity
  }

  updateNewValue(entity: DerivedEntity, change: IAvcChange): DerivedEntity {
    entity = this.updateValueCommon(entity, change)
    return entity
  }

  private updateValueCommon(entity: DerivedEntity, change: IAvcChange): DerivedEntity {
    if (typeof change === 'number') {
      entity.activeVideosCounter += change
      return entity
    }

    const [counterChange, entitiesToChange] = change

    const shouldChange =
      false ||
      (entity instanceof Channel && entitiesToChange.includes('channel')) ||
      (entity instanceof VideoCategory && entitiesToChange.includes('category'))

    if (shouldChange) {
      entity.activeVideosCounter += counterChange
    }

    return entity
  }
}

export function createVideoManager(store: DatabaseManager): DerivedPropertiesManager<Video, IAvcChange> {
  const manager = new DerivedPropertiesManager<Video, IAvcChange>(store, Video, [...videoRelationsForCounters])

  // listen to video change
  const listener = new VideoUpdateListener()
  const executors = [new ActiveVideoCounterExecutor<Video>((video) => video)]
  manager.registerListener(listener, executors)

  return manager
}

export function createStorageDataObjectManager(
  store: DatabaseManager
): DerivedPropertiesManager<StorageDataObject, IAvcChange> {
  const manager = new DerivedPropertiesManager<StorageDataObject, IAvcChange>(store, StorageDataObject)

  // listen to change of video's media file and thumbnail photo
  const storageDataObjectListener1 = new StorageDataObjectChangeListener_ThumbnailPhoto()
  const storageDataObjectListener2 = new StorageDataObjectChangeListener_Media()
  const storageDataObjectExecutors = (adapter) => [new ActiveVideoCounterExecutor<StorageDataObject>(adapter)]
  manager.registerListener(
    storageDataObjectListener1,
    storageDataObjectExecutors((storageDataObject) => storageDataObject.videoThumbnail)
  )
  manager.registerListener(
    storageDataObjectListener2,
    storageDataObjectExecutors((storageDataObject) => storageDataObject.videoMedia)
  )

  return manager
}
