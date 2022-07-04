// @ts-check
import { cryptoWaitReady } from '@polkadot/util-crypto'
import { Keyring } from '@polkadot/keyring'

async function main() {
  await cryptoWaitReady()

  const keyring = new Keyring({
    ss58Format: 126,
  })

  const suri = '//Alice'
  const userAddress = keyring.addFromUri(suri, undefined, 'sr25519').address
  console.log(userAddress)
}

main()
