import { DatabaseManager, StoreContext } from '@joystream/hydra-common'
import BN from 'bn.js'
import { WorkingGroup, ElectedCouncil, CouncilStageUpdate, CouncilStageIdle } from 'query-node/dist/model'
import { workingGroupsData } from './bootstrap-data'

import { CURRENT_NETWORK } from './common'

export async function bootstrapData({ store }: StoreContext): Promise<void> {
  await initWorkingGroups(store)
  await initCouncil(store)
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
