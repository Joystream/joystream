import { StoreContext } from '@joystream/hydra-common'
import BN from 'bn.js'
import { StorageSystemParameters } from 'query-node/dist/model'
import { storageSystem } from './genesis-data'

export async function loadGenesisData({ store }: StoreContext): Promise<void> {
  // Storage system
  await store.save<StorageSystemParameters>(
    new StorageSystemParameters({
      ...storageSystem,
      storageBucketMaxObjectsCountLimit: new BN(storageSystem.storageBucketMaxObjectsCountLimit),
      storageBucketMaxObjectsSizeLimit: new BN(storageSystem.storageBucketMaxObjectsSizeLimit),
      dataObjectFeePerMb: new BN(storageSystem.dataObjectFeePerMb),
    })
  )
}
