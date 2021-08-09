import { sendAndFollowSudoNamedTx, sendAndFollowNamedTx } from './api'
import { getAlicePair } from './accounts'
import { Option, Vec } from '@polkadot/types'
import { WorkerId, OpeningId, ApplicationId } from '@joystream/types/working-group'
import { MemberId } from '@joystream/types/members'
import { ApiPromise } from '@polkadot/api'
import logger from '../../services/logger'

/**
 * Hires the leader for the Storage working group.
 *
 * @remarks
 * This method should be used in the development mode only.
 *
 * @param api - runtime API promise
 * @return void promise
 *
 */
export async function hireStorageWorkingGroupLead(api: ApiPromise): Promise<void> {
  const SudoKeyPair = getAlicePair()
  const LeadKeyPair = getAlicePair()

  // Create membership if not already created
  const members = (await api.query.members.memberIdsByControllerAccountId(LeadKeyPair.address)) as Vec<MemberId>

  let memberId: MemberId | undefined = members.toArray()[0] as MemberId

  if (memberId === undefined) {
    logger.info('Preparing member account creation extrinsic...')
    memberId = (await api.query.members.nextMemberId()) as MemberId
    const tx = api.tx.members.buyMembership(0, 'alice', null, null)
    await sendAndFollowNamedTx(api, LeadKeyPair, tx)
  }

  // Create a new lead opening.
  const currentLead = (await api.query.storageWorkingGroup.currentLead()) as Option<WorkerId>
  if (currentLead.isSome) {
    logger.info('Storage lead already exists, skipping...')
    return
  }

  logger.info(`Making member id: ${memberId} the content lead.`)

  const newOpeningId = (await api.query.storageWorkingGroup.nextOpeningId()) as OpeningId
  const newApplicationId = (await api.query.storageWorkingGroup.nextApplicationId()) as ApplicationId

  // Create curator lead opening
  logger.info('Preparing Create Storage Lead Opening extrinsic...')
  let tx = api.tx.storageWorkingGroup.addOpening(
    { CurrentBlock: null }, // activate_at
    { max_review_period_length: 9999 }, // OpeningPolicyCommitment
    'storage opening', // human_readable_text
    'Leader' // opening_type
  )
  await sendAndFollowSudoNamedTx(api, SudoKeyPair, tx)

  // Apply to lead opening
  logger.info('Preparing Apply to Storage Lead Opening extrinsic...')
  tx = api.tx.storageWorkingGroup.applyOnOpening(
    memberId, // member id
    newOpeningId, // opening id
    LeadKeyPair.address, // address
    null, // opt role stake
    null, // opt appl. stake
    'bootstrap opening' // human_readable_text
  )
  await sendAndFollowNamedTx(api, LeadKeyPair, tx)

  // Begin review period
  logger.info('Preparing Begin Applicant Review extrinsic...')
  tx = api.tx.storageWorkingGroup.beginApplicantReview(newOpeningId)
  await sendAndFollowSudoNamedTx(api, SudoKeyPair, tx)

  // Fill opening
  logger.info('Preparing Fill Opening extrinsic...')
  tx = api.tx.storageWorkingGroup.fillOpening(
    newOpeningId, // opening id
    api.createType('ApplicationIdSet', [newApplicationId]), // successful applicants
    null // reward policy
  )
  await sendAndFollowSudoNamedTx(api, SudoKeyPair, tx)
}
