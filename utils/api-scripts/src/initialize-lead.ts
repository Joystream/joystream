import { ApiPromise, WsProvider } from '@polkadot/api'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { ExtrinsicsHelper, getAlicePair, getKeyFromSuri } from './helpers/extrinsics'
import { u64 } from '@polkadot/types'
import BN from 'bn.js'
import { createType } from '@joystream/types'
import { ApplicationId, OpeningId } from '@joystream/types/primitives'

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

async function main() {
  // Init api
  const WS_URI = process.env.WS_URI || 'ws://127.0.0.1:9944'
  console.log(`Initializing the api (${WS_URI})...`)
  const provider = new WsProvider(WS_URI)
  const api = await ApiPromise.create({ provider })

  const Group = process.env.GROUP || 'contentWorkingGroup'
  const LeadKeyPair = process.env.LEAD_URI ? getKeyFromSuri(process.env.LEAD_URI) : getAlicePair()
  const SudoKeyPair = process.env.SUDO_URI ? getKeyFromSuri(process.env.SUDO_URI) : getAlicePair()
  const StakeKeyPair = LeadKeyPair.derive(`//stake${Date.now()}`)

  if (!workingGroupModules.includes(Group as WorkingGroupModuleName)) {
    throw new Error(`Invalid working group: ${Group}`)
  }
  const groupModule = Group as WorkingGroupModuleName

  const txHelper = new ExtrinsicsHelper(api)

  const sudo = (tx: SubmittableExtrinsic<'promise'>) => api.tx.sudo.sudo(tx)

  // Create membership if not already created
  const memberEntries = await api.query.members.membershipById.entries()
  const matchingEntry = memberEntries.find(
    ([storageKey, member]) => 
      member.unwrap().controllerAccount.toString() === LeadKeyPair.address
  )
  let memberId = matchingEntry?.[0].args[0]

  // Only buy membership if LEAD_URI is not provided - ie for Alice
  if (!memberId && process.env.LEAD_URI) {
    throw new Error('Make sure Controller key LEAD_URI is for a member')
  }

  if (!memberId) {
    console.log('Buying new membership...')
    const [memberRes] = await txHelper.sendAndCheck(
      LeadKeyPair,
      [
        api.tx.members.buyMembership({
          rootAccount: LeadKeyPair.address,
          controllerAccount: LeadKeyPair.address,
          handle: 'alice',
        }),
      ],
      'Failed to setup member account'
    )
    memberId = memberRes.findRecord('members', 'MembershipBought')!.event.data[0] as u64
  }

  // Create a new lead opening
  if ((await api.query[groupModule].currentLead()).isSome) {
    console.log(`${groupModule} lead already exists, aborting...`)
  } else {
    console.log(`Making member id: ${memberId} the ${groupModule} lead.`)
    // Create lead opening
    console.log(`Creating ${groupModule} lead opening...`)
    const [openingRes] = await txHelper.sendAndCheck(
      SudoKeyPair,
      [
        sudo(
          api.tx[groupModule].addOpening(
            '',
            'Leader',
            {
              stakeAmount: MIN_APPLICATION_STAKE,
              leavingUnstakingPeriod: 99999,
            },
            null
          )
        ),
      ],
      `Failed to create ${groupModule} lead opening!`
    )
    const openingId = openingRes.findRecord(groupModule, 'OpeningAdded')!.event.data[0] as OpeningId

    // Set up stake account
    const addCandidateTx = api.tx.members.addStakingAccountCandidate(memberId)
    const addCandidateFee = (await addCandidateTx.paymentInfo(StakeKeyPair.address)).partialFee
    const stakingAccountBalance = MIN_APPLICATION_STAKE.add(addCandidateFee)
    console.log('Setting up staking account...')
    await txHelper.sendAndCheck(
      LeadKeyPair,
      [api.tx.balances.transfer(StakeKeyPair.address, stakingAccountBalance)],
      `Failed to send funds to staing account (${stakingAccountBalance})`
    )
    await txHelper.sendAndCheck(StakeKeyPair, [addCandidateTx], 'Failed to add staking candidate')
    await txHelper.sendAndCheck(
      LeadKeyPair,
      [api.tx.members.confirmStakingAccount(memberId, StakeKeyPair.address)],
      'Failed to confirm staking account'
    )

    console.log((await api.query.system.account(StakeKeyPair.address)).toHuman())

    // Apply to lead opening
    console.log(`Applying to ${groupModule} lead opening...`)
    const [applicationRes] = await txHelper.sendAndCheck(
      LeadKeyPair,
      [
        api.tx[groupModule].applyOnOpening({
          memberId: memberId,
          roleAccountId: LeadKeyPair.address,
          openingId: openingId,
          stakeParameters: {
            stake: MIN_APPLICATION_STAKE,
            staking_account_id: StakeKeyPair.address,
          },
        }),
      ],
      'Failed to apply on lead opening!'
    )

    const applicationId = applicationRes.findRecord(groupModule, 'AppliedOnOpening')!.event.data[1] as ApplicationId

    // Fill opening
    console.log('Filling the opening...')
    await txHelper.sendAndCheck(
      SudoKeyPair,
      [sudo(api.tx[groupModule].fillOpening(openingId, createType('BTreeSet<u64>', [applicationId])))],
      'Failed to fill the opening'
    )
  }
}

main()
  .then(() => process.exit())
  .catch((e) => console.error(e))
