import {
  createChannelManager,
  createStorageDataObjectManager,
  createVideoManager,
  IAvcChange,
} from './activeVideoCounters'
import { DatabaseManager } from '@joystream/hydra-common'
import { Channel, Video, StorageDataObject } from 'query-node/dist/model'
import { DerivedPropertiesManager } from '../classes'

let managers: IAllManagers
let lastStore: DatabaseManager

export interface IAllManagers {
  videos: DerivedPropertiesManager<Video, IAvcChange>
  channels: DerivedPropertiesManager<Channel, IAvcChange>
  storageDataObjects: DerivedPropertiesManager<StorageDataObject, IAvcChange>
}

export function getAllManagers(store: DatabaseManager): IAllManagers {
  // store can sometimes change - depends on Hydra's internal logic
  // make sure managers are always fresh
  if (!managers || lastStore !== store) {
    lastStore = store
    managers = {
      videos: createVideoManager(store),
      channels: createChannelManager(store),
      storageDataObjects: createStorageDataObjectManager(store),
    }
  }

  return managers
}
