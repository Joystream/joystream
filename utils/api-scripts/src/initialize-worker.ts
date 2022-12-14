import { createType } from '@joystream/types'
import { ApiPromise, WsProvider } from '@polkadot/api'
import { ExtrinsicsHelper, getAlicePair, getKeyFromSuri } from './helpers/extrinsics'
import { ApplicationId, OpeningId } from '@joystream/types/primitives'

const workingGroupModules = [
  'storageWorkingGroup',
  'contentWorkingGroup',
  'forumWorkingGroup',
  'membershipWorkingGroup',
  'appWorkingGroup',
  'operationsWorkingGroupAlpha',
  'operationsWorkingGroupBeta',
  'operationsWorkingGroupGamma',
  'distributionWorkingGroup',
] as const

type WorkingGroupModuleName = typeof workingGroupModules[number]

async function main() {
  // Init api
  const WS_URI = process.env.WS_URI || 'ws://127.0.0.1:9944'
  console.log(`Initializing the api (${WS_URI})...`)
  const provider = new WsProvider(WS_URI)
  const api = await ApiPromise.create({ provider })

  // Input data
  const Group = process.env.GROUP || 'contentWorkingGroup'
  const LeadRoleKeyPair = process.env.LEAD_URI ? getKeyFromSuri(process.env.LEAD_URI) : getAlicePair()
  const WorkerMemberKeyPair = process.env.WORKER_MEMBER_URI
    ? getKeyFromSuri(process.env.WORKER_MEMBER_URI)
    : getAlicePair()
  const WorkerRoleKeyPair = process.env.WORKER_ROLE_URI ? getKeyFromSuri(process.env.WORKER_ROLE_URI) : getAlicePair()
  const StakeKeyPair = process.env.STAKING_URI
    ? getKeyFromSuri(process.env.STAKING_URI)
    : WorkerRoleKeyPair.derive(`//stake${Date.now()}`)
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
  const leadWorker = (await api.query[groupModule].workerById(currentLead.unwrap())).unwrap()
  if (!leadWorker.roleAccountId.eq(LeadRoleKeyPair.address)) {
    throw new Error(`${groupModule} lead keypair invalid!`)
  }

  // Check if worker member exists
  const memberEntries = await api.query.members.membershipById.entries()
  const matchingMemberEntry = memberEntries.find(([, member]) =>
    member.unwrap().controllerAccount.eq(WorkerMemberKeyPair.address)
  )
  const memberId = matchingMemberEntry?.[0].args[0]
  if (!memberId) {
    throw new Error('Make sure WORKER_MEMBER_URI is for a member!')
  }

  // Check if worker already exists
  const workerEntries = await api.query[groupModule].workerById.entries()
  const matchingWorkerEntry = workerEntries.find(([, worker]) =>
    worker.unwrap().roleAccountId.eq(WorkerRoleKeyPair.address)
  )
  if (matchingWorkerEntry) {
    throw new Error(`Worker with role key ${WorkerRoleKeyPair.address} already exists`)
  }

  // Send opening stake to lead's stake account
  const openingStake = api.consts[groupModule].leaderOpeningStake
  console.log(`Topping up lead's staking account with opening stake...`)
  await txHelper.sendAndCheck(
    LeadRoleKeyPair,
    [api.tx.balances.transferKeepAlive(leadWorker.stakingAccountId, openingStake)],
    'Lead stake top-up failed'
  )

  // Create a new opening
  const minApplicationStake = api.consts[groupModule].minimumApplicationStake
  const minUnstakingPeriod = api.consts[groupModule].minUnstakingPeriodLimit
  console.log(`Creating ${groupModule} worker opening...`)
  const [openingRes] = await txHelper.sendAndCheck(
    LeadRoleKeyPair,
    [
      api.tx[groupModule].addOpening(
        '',
        'Regular',
        {
          stakeAmount: minApplicationStake,
          leavingUnstakingPeriod: minUnstakingPeriod,
        },
        null
      ),
    ],
    `Failed to create ${groupModule} worker opening!`
  )
  const openingId = openingRes.findRecord(groupModule, 'OpeningAdded')?.event.data[0] as OpeningId | undefined

  if (!openingId) {
    throw new Error('OpeningAdded event not found!')
  }

  // Setting up stake account
  const addCandidateTx = api.tx.members.addStakingAccountCandidate(memberId)
  const addCandidateFee = (await addCandidateTx.paymentInfo(StakeKeyPair.address)).partialFee
  const stakingAccountBalance = minApplicationStake.add(addCandidateFee)
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
        memberId,
        roleAccountId: WorkerRoleKeyPair.address,
        openingId,
        stakeParameters: {
          stake: minApplicationStake,
          stakingAccountId: StakeKeyPair.address,
        },
      }),
    ],
    'Failed to apply on worker opening!'
  )

  const applicationId = applicationRes.findRecord(groupModule, 'AppliedOnOpening')?.event.data[1] as
    | ApplicationId
    | undefined

  if (!applicationId) {
    throw new Error('AppliedOnOpening event not found!')
  }

  // Filling the opening
  console.log('Filling the opening...')
  await txHelper.sendAndCheck(
    LeadRoleKeyPair,
    [api.tx[groupModule].fillOpening(openingId, createType('BTreeSet<u64>', [applicationId]))],
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
