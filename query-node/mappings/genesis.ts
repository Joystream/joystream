import { StoreContext } from '@joystream/hydra-common'
import BN from 'bn.js'
import { Membership, MembershipEntryMethod, StorageSystemParameters } from 'query-node/dist/model'
import { storageSystem, members } from './genesis-data'

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
  // Members
  for (const m of members) {
    // create new membership
    const member = new Membership({
      // main data
      id: m.member_id,
      rootAccount: m.root_account,
      controllerAccount: m.controller_account,
      handle: m.handle,
      about: m.about,
      avatarUri: m.avatar_uri,
      createdInBlock: 0,
      entry: MembershipEntryMethod.GENESIS,
      // fill in auto-generated fields
      createdAt: new Date(m.registered_at_time),
      updatedAt: new Date(m.registered_at_time),
    })
    await store.save<Membership>(member)
  }
}
