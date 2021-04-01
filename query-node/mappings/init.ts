import { ApiPromise, WsProvider } from '@polkadot/api'
import { types } from '@joystream/types'
import { makeDatabaseManager } from '@dzlzv/hydra-db-utils'
import { createDBConnection } from '@dzlzv/hydra-processor'
import { MembershipSystem } from 'query-node/dist/src/modules/membership-system/membership-system.model'
import path from 'path'

// Temporary script to initialize processor database with some confing values initially hardcoded in the runtime
async function init() {
  const provider = new WsProvider(process.env.WS_PROVIDER_ENDPOINT_URI)
  const api = await ApiPromise.create({ provider, types })
  const entitiesPath = path.resolve(__dirname, '../../generated/graphql-server/dist/src/modules/**/*.model.js')
  const dbConnection = await createDBConnection([entitiesPath])
  const initialInvitationCount = await api.query.members.initialInvitationCount()
  const initialInvitationBalance = await api.query.members.initialInvitationBalance()
  const referralCut = await api.query.members.referralCut()
  const membershipPrice = await api.query.members.membershipPrice()
  const db = makeDatabaseManager(dbConnection.createEntityManager())
  const membershipSystem = new MembershipSystem({
    defaultInviteCount: initialInvitationCount.toNumber(),
    membershipPrice,
    referralCut: referralCut.toNumber(),
    invitedInitialBalance: initialInvitationBalance,
  })
  await db.save<MembershipSystem>(membershipSystem)
}

init()
  .then(() => {
    console.log('Processor database initialized')
    process.exit()
  })
  .catch((e) => {
    console.error(e)
    process.exit(-1)
  })
