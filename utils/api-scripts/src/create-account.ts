// @ts-check
import { cryptoWaitReady, mnemonicGenerate } from '@polkadot/util-crypto'
import { Keyring } from '@polkadot/keyring'

async function main() {
  await cryptoWaitReady()

  // https://polkadot.js.org/docs/keyring/start/create
  const keyring = new Keyring({
    type: 'sr25519',
    ss58Format: 126,
  })

  // Generate a new mnemonic
  const mnemonic = mnemonicGenerate()

  const keyringPair = keyring.addFromMnemonic(
    mnemonic,
    {
      name: 'User 1',
    },
    'sr25519'
  )

  console.log(keyringPair.address)
}

main().catch(console.error)
