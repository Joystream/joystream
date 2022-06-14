import { registry, types } from '@joystream/types'
import { MemberId } from '@joystream/types/common'
import { ApplicationId, OpeningId } from '@joystream/types/working-group'
import { ApiPromise, WsProvider } from '@polkadot/api'
import { ExtrinsicsHelper, getAlicePair, getKeyFromSuri } from './helpers/extrinsics'
import BN from 'bn.js'
import { BTreeSet } from '@polkadot/types'

const workingGroupModules = [
  'storageWorkingGroup',
  'contentWorkingGroup',
  'forumWorkingGroup',
  'membershipWorkingGroup',
  'gatewayWorkingGroup',
  'operationsWorkingGroupAlpha',
  'operationsWorkingGroupBeta',
  'operationsWorkingGroupGamma',
  'distributionWorkingGroup',
] as const

type WorkingGroupModuleName = typeof workingGroupModules[number]

const MIN_APPLICATION_STAKE = new BN(2000)
const STAKING_ACCOUNT_CANDIDATE_STAKE = new BN(200)
const OPENING_STAKE = new BN(2000)

async function main() {
  // Init api
  const WS_URI = process.env.WS_URI || 'ws://127.0.0.1:9944'
  console.log(`Initializing the api (${WS_URI})...`)
  const provider = new WsProvider(WS_URI)
  const api = await ApiPromise.create({ provider, types })

  // Input data
  const Group = process.env.GROUP || 'contentWorkingGroup'
  const LeadRoleKeyPair = process.env.LEAD_URI ? getKeyFromSuri(process.env.LEAD_URI) : getAlicePair()
  const WorkerMemberKeyPair = process.env.WORKER_MEMBER_URI
    ? getKeyFromSuri(process.env.WORKER_MEMBER_URI)
    : getAlicePair()
  const WorkerRoleKeyPair = process.env.WORKER_ROLE_URI ? getKeyFromSuri(process.env.WORKER_ROLE_URI) : getAlicePair()
  const StakeKeyPair = WorkerRoleKeyPair.derive(`//stake${Date.now()}`)
  const InitialWorkerBalanceTopUp = parseInt(process.env.INITIAL_WORKER_BALANCE_TOP_UP || '0') // In order to dev-initialize the storage worker

  // Check if group exists
  if (!workingGroupModules.includes(Group as WorkingGroupModuleName)) {
    throw new Error(`Invalid working group: ${Group}`)
  }
  const groupModule = Group as WorkingGroupModuleName

  const txHelper = new ExtrinsicsHelper(api)

  // Check if current lead exists
  const currentLead = await api.query[groupModule].currentLead()
  if (!currentLead.isSome) {
    throw new Error(`${groupModule} lead not set!`)
  }

  // Check if lead keypair is valid
  const leadWorker = await api.query[groupModule].workerById(currentLead.unwrap())
  if (!leadWorker.role_account_id.eq(LeadRoleKeyPair.address)) {
    throw new Error(`${groupModule} lead keypair invalid!`)
  }

  // Check if worker member exists
  const memberEntries = await api.query.members.membershipById.entries()
  const matchingMemberEntry = memberEntries.find(([, member]) =>
    member.controller_account.eq(WorkerMemberKeyPair.address)
  )
  const memberId: MemberId | undefined = matchingMemberEntry?.[0].args[0] as MemberId | undefined
  if (!memberId) {
    throw new Error('Make sure WORKER_MEMBER_URI is for a member!')
  }

  // Check if worker already exists
  const workerEntries = await api.query[groupModule].workerById.entries()
  const matchingWorkerEntry = workerEntries.find(([, worker]) => worker.role_account_id.eq(WorkerRoleKeyPair.address))
  if (matchingWorkerEntry) {
    throw new Error(`Worker with role key ${WorkerRoleKeyPair.address} already exists`)
  }

  // Send opening stake to lead's stake account
  console.log(`Topping up lead's staking account with OPENING_STAKE...`)
  await txHelper.sendAndCheck(
    LeadRoleKeyPair,
    [api.tx.balances.transferKeepAlive(leadWorker.staking_account_id, OPENING_STAKE)],
    'Lead stake top-up failed'
  )

  // Create a new opening
  console.log(`Creating ${groupModule} worker opening...`)
  const [openingRes] = await txHelper.sendAndCheck(
    LeadRoleKeyPair,
    [
      api.tx[groupModule].addOpening(
        '',
        'Regular',
        {
          stake_amount: MIN_APPLICATION_STAKE,
          leaving_unstaking_period: 99999,
        },
        null
      ),
    ],
    `Failed to create ${groupModule} worker opening!`
  )
  const openingId = openingRes.findRecord(groupModule, 'OpeningAdded')!.event.data[0] as OpeningId

  // Setting up stake account
  const addCandidateTx = api.tx.members.addStakingAccountCandidate(memberId)
  const addCandidateFee = (await addCandidateTx.paymentInfo(StakeKeyPair.address)).partialFee
  const stakingAccountBalance = MIN_APPLICATION_STAKE.add(STAKING_ACCOUNT_CANDIDATE_STAKE).add(addCandidateFee)
  console.log('Setting up staking account...')
  await txHelper.sendAndCheck(
    WorkerMemberKeyPair,
    [api.tx.balances.transfer(StakeKeyPair.address, stakingAccountBalance)],
    `Failed to send funds to staing account (${stakingAccountBalance})`
  )
  await txHelper.sendAndCheck(StakeKeyPair, [addCandidateTx], 'Failed to add staking candidate')
  await txHelper.sendAndCheck(
    WorkerMemberKeyPair,
    [api.tx.members.confirmStakingAccount(memberId, StakeKeyPair.address)],
    'Failed to confirm staking account'
  )

  console.log((await api.query.system.account(StakeKeyPair.address)).toHuman())

  // Applying to worker opening
  console.log(`Applying to ${groupModule} worker opening...`)
  const [applicationRes] = await txHelper.sendAndCheck(
    WorkerMemberKeyPair,
    [
      api.tx[groupModule].applyOnOpening({
        member_id: memberId,
        role_account_id: WorkerRoleKeyPair.address,
        opening_id: openingId,
        stake_parameters: {
          stake: MIN_APPLICATION_STAKE,
          staking_account_id: StakeKeyPair.address,
        },
      }),
    ],
    'Failed to apply on worker opening!'
  )

  const applicationId = applicationRes.findRecord(groupModule, 'AppliedOnOpening')!.event.data[1] as ApplicationId

  // Filling the opening
  console.log('Filling the opening...')
  await txHelper.sendAndCheck(
    LeadRoleKeyPair,
    [api.tx[groupModule].fillOpening(openingId, new (BTreeSet.with(ApplicationId))(registry, [applicationId]))],
    'Failed to fill the opening'
  )

  if (InitialWorkerBalanceTopUp) {
    console.log(`Topping up worker balance (${InitialWorkerBalanceTopUp})`)
    await txHelper.sendAndCheck(
      WorkerMemberKeyPair,
      [api.tx.balances.transferKeepAlive(WorkerRoleKeyPair.address, InitialWorkerBalanceTopUp)],
      'Worker initial balance top-up failed'
    )
  }
}

main()
  .then(() => process.exit())
  .catch((e) => console.error(e))
