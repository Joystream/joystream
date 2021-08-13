import { sendAndFollowSudoNamedTx, sendAndFollowNamedTx, getEvent } from './api'
import { getAlicePair } from './accounts'
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
  const members = await api.query.members.memberIdsByControllerAccountId(LeadKeyPair.address)

  let memberId: MemberId | undefined = members.toArray()[0]

  if (memberId === undefined) {
    logger.info('Preparing member account creation extrinsic...')
    memberId = await api.query.members.nextMemberId()
    const tx = api.tx.members.buyMembership(0, 'alice', null, null)
    await sendAndFollowNamedTx(api, LeadKeyPair, tx)
  }

  // Create a new lead opening.
  const currentLead = await api.query.storageWorkingGroup.currentLead()
  if (currentLead.isSome) {
    logger.info('Storage lead already exists, skipping...')
    return
  }

  logger.info(`Making member id: ${memberId} the content lead.`)

  // Create curator lead opening
  logger.info('Preparing Create Storage Lead Opening extrinsic...')
  let tx = api.tx.storageWorkingGroup.addOpening(
    { CurrentBlock: null }, // activate_at
    { max_review_period_length: 9999 }, // OpeningPolicyCommitment
    'storage opening', // human_readable_text
    'Leader' // opening_type
  )
  const newOpeningId = await sendAndFollowSudoNamedTx(api, SudoKeyPair, tx, (result) => {
    const event = getEvent(result, 'storageWorkingGroup', 'OpeningAdded')
    const bucketId = event?.data[0]

    return bucketId.toNumber()
  })

  if (typeof newOpeningId !== 'number') {
    throw Error('Cannot create opening.')
  }

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
  const newApplicationId = await sendAndFollowNamedTx(api, LeadKeyPair, tx, false, (result) => {
    const event = getEvent(result, 'storageWorkingGroup', 'AppliedOnOpening')
    const bucketId = event?.data[1]

    return bucketId.toNumber()
  })

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
