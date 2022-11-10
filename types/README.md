# `@joystream/types`

The types package provides types and api augmentation for `@polkadot/api` and some useful reusable functionality related to Joystream runtime types.

## Installation

Add the package as a dependency in your project.

```shell
yarn add @joystream/types

# or

npm install --save @joystream/types
```

## Example usage

```typescript
// Make sure to:
// import '@joystream/types'
// Even when you're not using any of functionality exported by the library,
// as this will automatically provide all the required '@polkadot/api' augmentations!
import { createType, JOYSTREAM_ADDRESS_PREFIX } from '@joystream/types'
// TypeScript interfaces for all the runtime types can be imported
// from the augmented `'@polkadot/types/lookup'`:
import { PalletMembershipBuyMembershipParameters } from '@polkadot/types/lookup'
import { ApiPromise, WsProvider } from '@polkadot/api'
import { Keyring } from '@polkadot/keyring'

async function main() {
  // Initialise the provider to connect to the local node
  const provider = new WsProvider('ws://127.0.0.1:9944')

  // Create the API and wait until ready
  const api = await ApiPromise.create({ provider })

  // Retrieve ALICE key pair
  const keyring = new Keyring({ type: 'sr25519', ss58Format: JOYSTREAM_ADDRESS_PREFIX })
  keyring.addFromUri('//Alice')
  const [ALICE] = keyring.getPairs()

  // Buy a new membership
  const membershipParams: PalletMembershipBuyMembershipParameters = createType(
    'PalletMembershipBuyMembershipParameters',
    // The second parameter is automatically typesafe!
    {
      handle: 'alice',
      rootAccount: ALICE.address,
      controllerAccount: ALICE.address,
      referrerId: null,
      metadata: '0x',
    }
  )

  const tx = api.tx.members.buyMembership(membershipParams) // Api interface is automatically decorated!

  await tx.signAndSend(ALICE, async ({ status }) => {
    if (status.isInBlock) {
      console.log('Membership successfuly bought!')
      const aliceMember = await api.query.members.membershipById(0) // Query results are automatically decorated!
      console.log('Member 0 handle hash:', aliceMember.unwrap().handleHash.toString())
    }
  })
}

main()
```
