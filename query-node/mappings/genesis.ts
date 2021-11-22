import { StoreContext, DatabaseManager } from '@dzlzv/hydra-common'
import BN from 'bn.js'
import { MembershipSystemSnapshot, WorkingGroup, ElectedCouncil, ElectionRound } from 'query-node/dist/model'
import { membershipSystem, workingGroups } from './genesis-data'

export async function loadGenesisData({ store }: StoreContext): Promise<void> {
  await initMembershipSystem(store)

  await initWorkingGroups(store)

  await initFirstElectionRound(store)

  // TODO: members, workers
}

async function initMembershipSystem(store: DatabaseManager) {
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
}

async function initWorkingGroups(store: DatabaseManager) {
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
}

async function initFirstElectionRound(store: DatabaseManager) {
  const electedCouncil = new ElectedCouncil({
    councilMembers: [],
    updates: [],
    electedAtBlock: 0,
    councilElections: [],
    nextCouncilElections: [],
    isResigned: false,
  })
  await store.save<ElectedCouncil>(electedCouncil)

  const initialElectionRound = new ElectionRound({
    cycleId: 0,
    isFinished: false,
    castVotes: [],
    electedCouncil,
    candidates: [],
  })
  await store.save<ElectionRound>(initialElectionRound)
}
