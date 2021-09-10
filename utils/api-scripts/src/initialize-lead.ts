import { registry, types } from '@joystream/types'
import { MemberId } from '@joystream/types/common'
import { ApplicationId, OpeningId } from '@joystream/types/working-group'
import { ApiPromise, WsProvider } from '@polkadot/api'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { ExtrinsicsHelper, getAlicePair, getKeyFromSuri } from './helpers/extrinsics'
import BN from 'bn.js'
import { BTreeSet } from '@polkadot/types'

const workingGroupModules = [
  'storageWorkingGroup',
  'contentDirectoryWorkingGroup',
  'forumWorkingGroup',
  'membershipWorkingGroup',
  'operationsWorkingGroup',
  'gatewayWorkingGroup',
] as const

type WorkingGroupModuleName = typeof workingGroupModules[number]

const MIN_APPLICATION_STAKE = new BN(2000)
const STAKING_ACCOUNT_CANDIDATE_STAKE = new BN(200)

async function main() {
  // Init api
  const WS_URI = process.env.WS_URI || 'ws://127.0.0.1:9944'
  console.log(`Initializing the api (${WS_URI})...`)
  const provider = new WsProvider(WS_URI)
  const api = await ApiPromise.create({ provider, types })

  const Group = process.env.GROUP || 'contentDirectoryWorkingGroup'
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
    ([storageKey, member]) => member.controller_account.toString() === LeadKeyPair.address
  )
  let memberId: MemberId | undefined = matchingEntry?.[0].args[0] as MemberId | undefined

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
          root_account: LeadKeyPair.address,
          controller_account: LeadKeyPair.address,
          handle: 'alice',
        }),
      ],
      'Failed to setup member account'
    )
    memberId = memberRes.findRecord('members', 'MembershipBought')!.event.data[0] as MemberId
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
              stake_amount: MIN_APPLICATION_STAKE,
              leaving_unstaking_period: 99999,
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
    const stakingAccountBalance = MIN_APPLICATION_STAKE.add(STAKING_ACCOUNT_CANDIDATE_STAKE).add(addCandidateFee)
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
          member_id: memberId,
          role_account_id: LeadKeyPair.address,
          opening_id: openingId,
          stake_parameters: {
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
      LeadKeyPair,
      [sudo(api.tx[groupModule].fillOpening(openingId, new (BTreeSet.with(ApplicationId))(registry, [applicationId])))],
      'Failed to fill the opening'
    )
  }
}

main()
  .then(() => process.exit())
  .catch((e) => console.error(e))
