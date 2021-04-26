import { ApiPromise } from '@polkadot/api'
import { BalanceOf } from '@polkadot/types/interfaces'
import { DatabaseManager } from '@dzlzv/hydra-db-utils'
import { Block, MembershipSystemSnapshot, WorkingGroup } from 'query-node/dist/model'
import { CURRENT_NETWORK } from './common'
import BN from 'bn.js'

async function initMembershipSystem(api: ApiPromise, db: DatabaseManager) {
  const initialInvitationCount = await api.query.members.initialInvitationCount.at(api.genesisHash)
  const initialInvitationBalance = await api.query.members.initialInvitationBalance.at(api.genesisHash)
  const referralCut = await api.query.members.referralCut.at(api.genesisHash)
  const membershipPrice = await api.query.members.membershipPrice.at(api.genesisHash)
  const genesisBlock = new Block({
    id: `${CURRENT_NETWORK}-0`,
    network: CURRENT_NETWORK,
    number: 0,
    timestamp: new BN(0),
  })
  const membershipSystem = new MembershipSystemSnapshot({
    snapshotBlock: genesisBlock,
    snapshotTime: new Date(0),
    defaultInviteCount: initialInvitationCount.toNumber(),
    membershipPrice,
    referralCut: referralCut.toNumber(),
    invitedInitialBalance: initialInvitationBalance,
  })
  await db.save<Block>(genesisBlock)
  await db.save<MembershipSystemSnapshot>(membershipSystem)
}

async function initWorkingGroups(api: ApiPromise, db: DatabaseManager) {
  const groupNames = Object.keys(api.query).filter((k) => k.endsWith('WorkingGroup'))
  const groups = await Promise.all(
    groupNames.map(async (groupName) => {
      const budget = await api.query[groupName].budget.at<BalanceOf>(api.genesisHash)
      return new WorkingGroup({
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
