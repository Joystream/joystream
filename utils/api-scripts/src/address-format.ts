// @ts-check
import { cryptoWaitReady, decodeAddress } from '@polkadot/util-crypto'
import { Keyring } from '@polkadot/keyring'
import { JOYSTREAM_ADDRESS_PREFIX } from '@joystream/types'

export function validateAddress(address: string, errorMessage = 'Invalid address'): string | true {
  try {
    decodeAddress(address)
  } catch (e) {
    return errorMessage
  }

  return true
}

async function main() {
  await cryptoWaitReady()

  const keyring = new Keyring({
    ss58Format: JOYSTREAM_ADDRESS_PREFIX,
  })

  const suri = '//Alice'
  const userAddress = keyring.addFromUri(suri, undefined, 'sr25519').address

  validateAddress(userAddress)

  console.log(userAddress)
}

main().catch(console.error)
