import { createType, JOYSTREAM_ADDRESS_PREFIX } from '@joystream/types'
import { ApiPromise, WsProvider } from '@polkadot/api'
import { Keyring } from '@polkadot/keyring'

async function main() {
  // Initialise the provider to connect to the local node
  const provider = new WsProvider('ws://127.0.0.1:9944')
  
  // Create the API and wait until ready
  const api = await ApiPromise.create({ provider })
  
  const keyring = new Keyring({ type: 'sr25519', ss58Format: JOYSTREAM_ADDRESS_PREFIX })
  keyring.addFromUri(process.env.SURI || '//Alice')
  const [KEY] = keyring.getPairs()
  
  // Buy a new membership
  const membershipParams = createType(
    'PalletMembershipBuyMembershipParameters',
    // The second parameter is automatically typesafe!
    {
      handle: KEY.address.substr(-8),
      rootAccount: KEY.address,
      controllerAccount: KEY.address,
      referrerId: null,
      metadata: '0x'
    }
  )

  const tx = api.tx.members.buyMembership(membershipParams) // Api interface is automatically decorated!
    
  await tx.signAndSend(KEY, async ({ status }) => {
    if (status.isInBlock) {
      console.log('Membership successfuly bought!')
      const aliceMember = await api.query.members.membershipById(0) // Query results are automatically decorated!
      console.log("Member 0 handle hash:", aliceMember.unwrap().handleHash.toString())
      process.exit()
    }
  })
}
  
main().catch(console.error)