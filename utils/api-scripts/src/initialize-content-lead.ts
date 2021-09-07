import { types } from '@joystream/types'
import { ApiPromise, WsProvider } from '@polkadot/api'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { ExtrinsicsHelper, getAlicePair, getKeyFromSuri } from './helpers/extrinsics'

async function main() {
  // Init api
  const WS_URI = process.env.WS_URI || 'ws://127.0.0.1:9944'
  console.log(`Initializing the api (${WS_URI})...`)
  const provider = new WsProvider(WS_URI)
  const api = await ApiPromise.create({ provider, types })

  const LeadKeyPair = process.env.LEAD_URI ? getKeyFromSuri(process.env.LEAD_URI) : getAlicePair()
  const SudoKeyPair = process.env.SUDO_URI ? getKeyFromSuri(process.env.SUDO_URI) : getAlicePair()

  const txHelper = new ExtrinsicsHelper(api)

  const sudo = (tx: SubmittableExtrinsic<'promise'>) => api.tx.sudo.sudo(tx)

  // Create membership if not already created
  let memberId: number | undefined = (await api.query.members.memberIdsByControllerAccountId(LeadKeyPair.address))
    .toArray()[0]
    ?.toNumber()

  // Only buy membership if LEAD_URI is not provided - ie for Alice
  if (memberId === undefined && process.env.LEAD_URI) {
    throw new Error('Make sure Controller key LEAD_URI is for a member')
  }

  if (memberId === undefined) {
    console.log('Perparing member account creation extrinsic...')
    memberId = (await api.query.members.nextMemberId()).toNumber()
    await txHelper.sendAndCheck(
      LeadKeyPair,
      [api.tx.members.buyMembership(0, 'alice', null, null)],
      'Failed to setup member account'
    )
  }

  // Create a new lead opening
  if ((await api.query.contentDirectoryWorkingGroup.currentLead()).isSome) {
    console.log('Curators lead already exists, aborting...')
  } else {
    console.log(`Making member id: ${memberId} the content lead.`)
    const newOpeningId = (await api.query.contentDirectoryWorkingGroup.nextOpeningId()).toNumber()
    const newApplicationId = (await api.query.contentDirectoryWorkingGroup.nextApplicationId()).toNumber()
    // Create curator lead opening
    console.log('Perparing Create Curator Lead Opening extrinsic...')
    await txHelper.sendAndCheck(
      SudoKeyPair,
      [
        sudo(
          api.tx.contentDirectoryWorkingGroup.addOpening(
            { CurrentBlock: null }, // activate_at
            { max_review_period_length: 9999 }, // OpeningPolicyCommitment
            'bootstrap curator opening', // human_readable_text
            'Leader' // opening_type
          )
        ),
      ],
      'Failed to create Content Curators Lead opening!'
    )

    // Apply to lead opening
    console.log('Perparing Apply to Curator Lead Opening as extrinsic...')
    await txHelper.sendAndCheck(
      LeadKeyPair,
      [
        api.tx.contentDirectoryWorkingGroup.applyOnOpening(
          memberId, // member id
          newOpeningId, // opening id
          LeadKeyPair.address, // address
          null, // opt role stake
          null, // opt appl. stake
          'bootstrap curator opening' // human_readable_text
        ),
      ],
      'Failed to apply on lead opening!'
    )

    const extrinsics: SubmittableExtrinsic<'promise'>[] = []
    // Begin review period
    console.log('Perparing Begin Applicant Review extrinsic...')
    extrinsics.push(sudo(api.tx.contentDirectoryWorkingGroup.beginApplicantReview(newOpeningId)))

    // Fill opening
    console.log('Perparing Fill Opening extrinsic...')
    extrinsics.push(
      sudo(
        api.tx.contentDirectoryWorkingGroup.fillOpening(
          newOpeningId, // opening id
          api.createType('ApplicationIdSet', [newApplicationId]), // succesful applicants
          null // reward policy
        )
      )
    )

    await txHelper.sendAndCheck(SudoKeyPair, extrinsics, 'Failed to initialize Content Curators Lead!')
  }
}

main()
  .then(() => process.exit())
  .catch((e) => console.error(e))
