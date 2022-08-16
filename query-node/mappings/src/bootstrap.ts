import { DatabaseManager, StoreContext } from '@joystream/hydra-common'
import BN from 'bn.js'
import {
  StorageSystemParameters,
  MembershipSystemSnapshot,
  WorkingGroup,
  ElectedCouncil,
  CouncilStageUpdate,
  CouncilStageIdle,
} from 'query-node/dist/model'
import { storageSystemData, membershipSystemData, workingGroupsData } from './bootstrap-data'

import { CURRENT_NETWORK } from './common'

export async function bootstrapData({ store }: StoreContext): Promise<void> {
  await initMembershipSystem(store)
  await initStorageSystem(store)
  await initWorkingGroups(store)
  await initCouncil(store)
}

async function initMembershipSystem(store: DatabaseManager): Promise<void> {
  await store.save<MembershipSystemSnapshot>(
    new MembershipSystemSnapshot({
      snapshotBlock: 0,
      ...membershipSystemData,
      membershipPrice: new BN(membershipSystemData.membershipPrice),
      invitedInitialBalance: new BN(membershipSystemData.invitedInitialBalance),
    })
  )
}

async function initStorageSystem(store: DatabaseManager): Promise<void> {
  // Storage system
  await store.save<StorageSystemParameters>(
    new StorageSystemParameters({
      ...storageSystemData,
      storageBucketMaxObjectsCountLimit: new BN(storageSystemData.storageBucketMaxObjectsCountLimit),
      storageBucketMaxObjectsSizeLimit: new BN(storageSystemData.storageBucketMaxObjectsSizeLimit),
      dataObjectFeePerMb: new BN(storageSystemData.dataObjectFeePerMb),
    })
  )
}

async function initWorkingGroups(store: DatabaseManager): Promise<void> {
  await Promise.all(
    workingGroupsData.map(async (group) =>
      store.save<WorkingGroup>(
        new WorkingGroup({
          id: group.name,
          name: group.name,
          budget: new BN(group.budget),
        })
      )
    )
  )
}

async function initCouncil(store: DatabaseManager): Promise<void> {
  const electedCouncil = new ElectedCouncil({
    councilMembers: [],
    updates: [],
    electedAtBlock: 0,
    electedAtTime: new Date(0),
    electedAtNetwork: CURRENT_NETWORK,
    councilElections: [],
    nextCouncilElections: [],
    isResigned: false,
  })
  await store.save<ElectedCouncil>(electedCouncil)

  const stage = new CouncilStageIdle()
  stage.endsAt = 1
  const initialStageUpdate = new CouncilStageUpdate({
    stage,
    electedCouncil,
    changedAt: new BN(0),
  })
  await store.save<CouncilStageUpdate>(initialStageUpdate)
}
