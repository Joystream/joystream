import { types } from '@joystream/types'
import { ApiPromise, WsProvider } from '@polkadot/api'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { ExtrinsicsHelper, getAlicePair } from '../src/helpers/extrinsics'

async function main() {
  // Init api
  const WS_URI = process.env.WS_URI || 'ws://127.0.0.1:9944'
  console.log(`Initializing the api (${WS_URI})...`)
  const provider = new WsProvider(WS_URI)
  const api = await ApiPromise.create({ provider, types })

  const ALICE = getAlicePair()

  const txHelper = new ExtrinsicsHelper(api)

  const sudo = (tx: SubmittableExtrinsic<'promise'>) => api.tx.sudo.sudo(tx)
  const extrinsics: SubmittableExtrinsic<'promise'>[] = []

  // Create membership if not already created
  let aliceMemberId: number | undefined = (await api.query.members.memberIdsByControllerAccountId(ALICE.address))
    .toArray()[0]
    ?.toNumber()

  if (aliceMemberId === undefined) {
    console.log('Perparing Alice member account creation extrinsic...')
    aliceMemberId = (await api.query.members.nextMemberId()).toNumber()
    extrinsics.push(api.tx.members.buyMembership(0, 'alice', null, null))
  } else {
    console.log(`Alice member id found: ${aliceMemberId}...`)
  }

  // Set Alice as lead if lead not already set
  if ((await api.query.contentDirectoryWorkingGroup.currentLead()).isNone) {
    const newOpeningId = (await api.query.contentDirectoryWorkingGroup.nextOpeningId()).toNumber()
    const newApplicationId = (await api.query.contentDirectoryWorkingGroup.nextApplicationId()).toNumber()
    // Create curator lead opening
    console.log('Perparing Create Curator Lead Opening extrinsic...')
    extrinsics.push(
      sudo(
        api.tx.contentDirectoryWorkingGroup.addOpening(
          { CurrentBlock: null }, // activate_at
          { max_review_period_length: 9999 }, // OpeningPolicyCommitment
          'api-examples curator opening', // human_readable_text
          'Leader' // opening_type
        )
      )
    )

    // Apply to lead opening
    console.log('Perparing Apply to Curator Lead Opening as Alice extrinsic...')
    extrinsics.push(
      api.tx.contentDirectoryWorkingGroup.applyOnOpening(
        aliceMemberId, // member id
        newOpeningId, // opening id
        ALICE.address, // address
        null, // opt role stake
        null, // opt appl. stake
        'api-examples curator opening appl.' // human_readable_text
      )
    )

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

    console.log('Sending extrinsics...')
    await txHelper.sendAndCheck(ALICE, extrinsics, 'Failed to initialize Alice as Content Curators Lead!')
  } else {
    console.log('Curators lead already exists, skipping...')
  }
}

main()
  .then(() => process.exit())
  .catch((e) => console.error(e))
