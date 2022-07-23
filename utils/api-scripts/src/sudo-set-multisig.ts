import { JOYSTREAM_ADDRESS_PREFIX } from '@joystream/types'
import { ApiPromise, WsProvider } from '@polkadot/api'
import { encodeMultiAddress } from '@polkadot/util-crypto'
import { ExtrinsicsHelper } from './helpers/extrinsics'

async function main() {
  const sudoMultiKeys = (process.env.NEW_SUDO_MULTISIG_KEYS || '').split(',').filter((v) => v)
  const sudoMultisigThreshold = parseInt(process.env.SUDO_MULTISIG_THRESHOLD || '')
  const wsUri = process.env.WS_URI || 'ws://127.0.0.1:9944'

  console.log('Multisig keys:', sudoMultiKeys)
  console.log('Multisig threshold:', sudoMultisigThreshold)

  if (sudoMultiKeys.length < 2) {
    throw new Error('Provide SUDO_MULTISIG_KEYS env with at least 2 keys in order to generate multisig address')
  }

  if (sudoMultisigThreshold < 1) {
    throw new Error('The SUDO_MULTISIG_THRESHOLD should be at least 1')
  }

  const provider = new WsProvider(wsUri)
  const api = await ApiPromise.create({ provider })

  let multisigAddr: string
  try {
    multisigAddr = encodeMultiAddress(sudoMultiKeys, sudoMultisigThreshold, JOYSTREAM_ADDRESS_PREFIX)
  } catch (e) {
    throw new Error(`Failed to generate multisig address: ${(e as Error).message}`)
  }

  console.log('Multisig address:', multisigAddr)

  const txHelper = new ExtrinsicsHelper(api)

  console.log('Updating the sudo key...')
  await txHelper.sendAndCheckSudo(api.tx.sudo.setKey(multisigAddr), 'sudo.setKey failed', false)

  console.log(`Sudo key changed to: ${multisigAddr}`)
}

main()
  .then(() => process.exit(0))
  .catch(console.error)
