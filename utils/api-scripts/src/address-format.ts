// @ts-check
import { cryptoWaitReady } from '@polkadot/util-crypto'
import { Keyring } from '@polkadot/keyring'
import { JOYSTREAM_ADDRESS_PREFIX } from '@joystream/types'

async function main() {
  await cryptoWaitReady()

  const keyring = new Keyring({
    ss58Format: JOYSTREAM_ADDRESS_PREFIX,
  })

  const suri = '//Alice'
  const userAddress = keyring.addFromUri(suri, undefined, 'sr25519').address
  console.log(userAddress)
}

main().catch(console.error)
