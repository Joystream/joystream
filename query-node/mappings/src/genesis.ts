import { StoreContext, DatabaseManager } from '@joystream/hydra-common'
import BN from 'bn.js'
import {
  MembershipSystemSnapshot,
  WorkingGroup,
  ElectedCouncil,
  ElectionRound,
  MembershipEntryGenesis,
} from 'query-node/dist/model'
import { membershipSystem, workingGroups, members } from './genesis-data'
import { CURRENT_NETWORK } from './common'
import { createNewMember } from './membership'
import { MembershipMetadata } from '@joystream/metadata-protobuf'

export async function loadGenesisData({ store }: StoreContext): Promise<void> {
  await initMembershipSystem(store)

  await initWorkingGroups(store)

  await initFirstElectionRound(store)

  await initMembers(store)

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

async function initMembers(store: DatabaseManager) {
  for (const obj of members) {
    // Casting for empty members array by default
    const member = obj as {
      member_id: number
      root_account: string
      controller_account: string
      handle: string
      about: string
      avatar_uri: string
    }

    await createNewMember(
      store,
      new Date(0),
      member.member_id.toString(),
      new MembershipEntryGenesis(),
      member.root_account,
      member.controller_account,
      member.handle,
      0,
      new MembershipMetadata({
        about: member.about,
        avatarUri: member.avatar_uri,
      })
    )
  }
}

async function initFirstElectionRound(store: DatabaseManager) {
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

  const initialElectionRound = new ElectionRound({
    cycleId: 0,
    isFinished: false,
    castVotes: [],
    electedCouncil,
    candidates: [],
  })
  await store.save<ElectionRound>(initialElectionRound)
}
