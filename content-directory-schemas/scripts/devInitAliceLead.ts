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
    extrinsics.push(
      api.tx.members.buyMembership({
        root_account: ALICE.address,
        controller_account: ALICE.address,
        name: 'Alice',
        handle: 'Alice',
      })
    )
  } else {
    console.log(`Alice member id found: ${aliceMemberId}...`)
  }

  // Set Alice as lead if lead not already set
  if ((await api.query.contentDirectoryWorkingGroup.currentLead()).isNone) {
    const newOpeningId = (await api.query.contentDirectoryWorkingGroup.nextOpeningId()).toNumber()
    const newApplicationId = (await api.query.contentDirectoryWorkingGroup.nextApplicationId()).toNumber()
    // Create curator lead opening
    console.log('Perparing Create Curator Lead Opening extrinsic...')
    extrinsics.push(sudo(api.tx.contentDirectoryWorkingGroup.addOpening('init-alice-lead', 'Leader', null, null)))

    // Apply to lead opening
    console.log('Perparing Apply to Curator Lead Opening as Alice extrinsic...')
    extrinsics.push(
      api.tx.contentDirectoryWorkingGroup.applyOnOpening({
        member_id: aliceMemberId,
        opening_id: newOpeningId,
        role_account_id: ALICE.address,
        reward_account_id: ALICE.address,
        description: 'api-examples curator opening appl.',
        stake_parameters: null,
      })
    )

    // Fill opening
    console.log('Perparing Fill Opening extrinsic...')
    extrinsics.push(
      sudo(
        api.tx.contentDirectoryWorkingGroup.fillOpening(
          newOpeningId,
          api.createType('ApplicationIdSet', [newApplicationId])
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
