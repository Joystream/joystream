import { ApiPromise } from '@polkadot/api'
import { BalanceOf } from '@polkadot/types/interfaces'
import { DatabaseManager } from '@dzlzv/hydra-common'
import { MembershipSystemSnapshot, WorkingGroup } from 'query-node/dist/model'

async function initMembershipSystem(api: ApiPromise, db: DatabaseManager) {
  const initialInvitationCount = await api.query.members.initialInvitationCount.at(api.genesisHash)
  const initialInvitationBalance = await api.query.members.initialInvitationBalance.at(api.genesisHash)
  const referralCut = await api.query.members.referralCut.at(api.genesisHash)
  const membershipPrice = await api.query.members.membershipPrice.at(api.genesisHash)
  const membershipSystem = new MembershipSystemSnapshot({
    createdAt: new Date(0),
    updatedAt: new Date(0),
    snapshotBlock: 0,
    defaultInviteCount: initialInvitationCount.toNumber(),
    membershipPrice,
    referralCut: referralCut.toNumber(),
    invitedInitialBalance: initialInvitationBalance,
  })
  await db.save<MembershipSystemSnapshot>(membershipSystem)
}

async function initWorkingGroups(api: ApiPromise, db: DatabaseManager) {
  const groupNames = Object.keys(api.query).filter((k) => k.endsWith('WorkingGroup'))
  const groups = await Promise.all(
    groupNames.map(async (groupName) => {
      const budget = await api.query[groupName].budget.at<BalanceOf>(api.genesisHash)
      return new WorkingGroup({
        createdAt: new Date(0),
        updatedAt: new Date(0),
        id: groupName,
        name: groupName,
        workers: [],
        openings: [],
        budget,
      })
    })
  )
  await Promise.all(groups.map((g) => db.save<WorkingGroup>(g)))
}

export default async function initializeDb(api: ApiPromise, db: DatabaseManager): Promise<void> {
  await initMembershipSystem(api, db)
  await initWorkingGroups(api, db)
}
