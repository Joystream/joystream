import {
  createChannelManager,
  createStorageDataObjectManager,
  createVideoManager,
  IAvcChange,
  IAvcChannelChange,
} from './activeVideoCounters'
import { createVideoNftManager, IOwnedNftChange } from './videoNftCollectors'
import { DatabaseManager } from '@joystream/hydra-common'
import { Channel, OwnedNft, Video, StorageDataObject } from 'query-node/dist/model'
import { DerivedPropertiesManager } from '../classes'

let managers: IAllManagers
let lastStore: DatabaseManager

export interface IAllManagers {
  videos: DerivedPropertiesManager<Video, IAvcChange>
  channels: DerivedPropertiesManager<Channel, IAvcChannelChange>
  storageDataObjects: DerivedPropertiesManager<StorageDataObject, IAvcChange>
  videoNfts: DerivedPropertiesManager<OwnedNft, IOwnedNftChange>
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
      videoNfts: createVideoNftManager(store),
    }
  }

  return managers
}
