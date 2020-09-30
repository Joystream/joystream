import { types } from '@joystream/types'
import { ApiPromise, Keyring, WsProvider } from '@polkadot/api'
import { SubmittableExtrinsic } from '@polkadot/api/types'

async function main() {
  // Init api
  const WS_URI = process.env.WS_URI || 'ws://127.0.0.1:9944'
  console.log(`Initializing the api (${WS_URI})...`)
  const provider = new WsProvider(WS_URI)
  const api = await ApiPromise.create({ provider, types })
  // Init ALICE keypair
  const keyring = new Keyring({ type: 'sr25519' })
  keyring.addFromUri('//Alice', { name: 'Alice' })
  const ALICE = keyring.getPairs()[0]

  let nonce = (await api.query.system.account(ALICE.address)).nonce.toNumber()
  const stdCall = (tx: SubmittableExtrinsic<'promise'>) => tx.signAndSend(ALICE, { nonce: nonce++ })
  const sudoCall = (tx: SubmittableExtrinsic<'promise'>) => api.tx.sudo.sudo(tx).signAndSend(ALICE, { nonce: nonce++ })

  // Create membership if not already created
  let aliceMemberId: number | undefined = (await api.query.members.memberIdsByControllerAccountId(ALICE.address))
    .toArray()[0]
    ?.toNumber()

  if (aliceMemberId === undefined) {
    console.log('Sending Alice member account creation extrinsic...')
    aliceMemberId = (await api.query.members.nextMemberId()).toNumber()
    await stdCall(api.tx.members.buyMembership(0, 'alice', null, null))
  } else {
    console.log(`Alice member id found: ${aliceMemberId}...`)
  }

  // Set Alice as lead if lead not already set
  if ((await api.query.contentDirectoryWorkingGroup.currentLead()).isNone) {
    const newOpeningId = (await api.query.contentDirectoryWorkingGroup.nextOpeningId()).toNumber()
    const newApplicationId = (await api.query.contentDirectoryWorkingGroup.nextApplicationId()).toNumber()
    // Create curator lead opening
    console.log('Sending Create Curator Lead Opening extrinsic...')
    await sudoCall(
      api.tx.contentDirectoryWorkingGroup.addOpening(
        { CurrentBlock: null }, // activate_at
        { max_review_period_length: 9999 }, // OpeningPolicyCommitment
        'api-examples curator opening', // human_readable_text
        'Leader' // opening_type
      )
    )

    // Apply to lead opening
    console.log('Sending Apply to Curator Lead Opening as Alice extrinsic...')
    await stdCall(
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
    console.log('Sending Begin Applicant Review extrinsic...')
    await sudoCall(api.tx.contentDirectoryWorkingGroup.beginApplicantReview(newOpeningId))

    // Fill opening
    console.log('Sending Fill Opening extrinsic...')
    await sudoCall(
      api.tx.contentDirectoryWorkingGroup.fillOpening(
        newOpeningId, // opening id
        api.createType('ApplicationIdSet', [newApplicationId]), // succesful applicants
        null // reward policy
      )
    )
  } else {
    console.log('Curators lead already exists, skipping...')
  }
}

main()
  .then(() => process.exit())
  .catch((e) => console.error(e))
