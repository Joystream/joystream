import { StoreContext } from '@dzlzv/hydra-common'
import BN from 'bn.js'
import { MembershipSystemSnapshot, WorkingGroup } from 'query-node/dist/model'
import { membershipSystem, workingGroups } from './genesis-data'

export async function loadGenesisData({ store }: StoreContext): Promise<void> {
  // Membership system
  await store.save<MembershipSystemSnapshot>(
    new MembershipSystemSnapshot({
      createdAt: new Date(0),
      updatedAt: new Date(0),
      snapshotBlock: 0,
      ...membershipSystem,
      membershipPrice: new BN(membershipSystem.membershipPrice),
      invitedInitialBalance: new BN(membershipSystem.invitedInitialBalance),
    })
  )

  // Working groups
  await Promise.all(
    workingGroups.map(async (group) =>
      store.save<WorkingGroup>(
        new WorkingGroup({
          createdAt: new Date(0),
          updatedAt: new Date(0),
          id: group.name,
          name: group.name,
          budget: new BN(group.budget),
        })
      )
    )
  )

  // TODO: members, workers
}
