import {
  createApi,
  getAlicePair,
  sendAndFollowSudoNamedTx,
  sendAndFollowNamedTx,
} from './runtimeApi'
import { CodecArg } from '@polkadot/types/types'
import { Option, Vec } from '@polkadot/types'
import {
  WorkerId,
  OpeningId,
  ApplicationId,
} from '@joystream/types/working-group'
import { MemberId } from '@joystream/types/members'

export async function hireStorageWorkingGroupLead(): Promise<void> {
  const api = await createApi()

  const SudoKeyPair = getAlicePair()
  const LeadKeyPair = getAlicePair()

  const nullValue = (null as unknown) as CodecArg

  // Create membership if not already created
  const members = (await api.query.members.memberIdsByControllerAccountId(
    LeadKeyPair.address
  )) as Vec<MemberId>

  let memberId:
    | bigint
    | undefined = (members.toArray()[0] as MemberId)?.toBigInt()

  if (memberId === undefined) {
    console.log('Preparing member account creation extrinsic...')
    memberId = ((await api.query.members.nextMemberId()) as MemberId).toBigInt()
    await sendAndFollowNamedTx(api, LeadKeyPair, 'members', 'buyMembership', [
      0,
      'alice',
      nullValue,
      nullValue,
    ])
  }

  // Create a new lead opening.
  const currentLead = (await api.query.storageWorkingGroup.currentLead()) as Option<
    WorkerId
  >
  if (currentLead.isSome) {
    console.log('Storage lead already exists, skipping...')
    return
  }

  console.log(`Making member id: ${memberId} the content lead.`)

  const newOpeningId = ((await api.query.storageWorkingGroup.nextOpeningId()) as OpeningId).toBigInt()
  const newApplicationId = ((await api.query.storageWorkingGroup.nextApplicationId()) as ApplicationId).toBigInt()

  // Create curator lead opening
  console.log('Preparing Create Storage Lead Opening extrinsic...')
  await sendAndFollowSudoNamedTx(
    api,
    SudoKeyPair,
    'storageWorkingGroup',
    'addOpening',
    [
      { CurrentBlock: nullValue }, // activate_at
      { max_review_period_length: 9999 }, // OpeningPolicyCommitment
      'storage opening', // human_readable_text
      'Leader', // opening_type
    ]
  )

  // Apply to lead opening
  console.log('Preparing Apply to Storage Lead Opening extrinsic...')
  await sendAndFollowNamedTx(
    api,
    LeadKeyPair,
    'storageWorkingGroup',
    'applyOnOpening',
    [
      memberId, // member id
      newOpeningId, // opening id
      LeadKeyPair.address, // address
      nullValue, // opt role stake
      nullValue, // opt appl. stake
      'bootstrap opening', // human_readable_text
    ]
  )

  // Begin review period
  console.log('Preparing Begin Applicant Review extrinsic...')
  await sendAndFollowSudoNamedTx(
    api,
    SudoKeyPair,
    'storageWorkingGroup',
    'beginApplicantReview',
    [newOpeningId]
  )

  // Fill opening
  console.log('Preparing Fill Opening extrinsic...')
  await sendAndFollowSudoNamedTx(
    api,
    SudoKeyPair,
    'storageWorkingGroup',
    'fillOpening',
    [
      newOpeningId, // opening id
      api.createType('ApplicationIdSet', [newApplicationId]), // successful applicants
      nullValue, // reward policy
    ]
  )
}
