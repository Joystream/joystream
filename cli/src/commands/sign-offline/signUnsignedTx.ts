import SignOfflineCommandBase from '../../base/SignOfflineCommandBase'
import { flags } from '@oclif/command'
import ExitCodes from '../../ExitCodes'
import { JOYSTREAM_ADDRESS_PREFIX, registry } from '@joystream/types'
import { IOFlags, ensureOutputFileIsWriteable, getInputJson, saveOutputJsonToFile } from '../../helpers/InputOutput'
import { decodeSignedTx } from '@substrate/txwrapper-core/lib/core/decode/decodeSignedTx'
import { decodeSigningPayload } from '@substrate/txwrapper-core/lib/core/decode/decodeSigningPayload'
import { Keyring } from '@polkadot/api'
import { waitReady } from '@polkadot/wasm-crypto'
import { KeyringOptions, KeyringPair, KeyringPair$Json } from '@polkadot/keyring/types'
import { createSignedTx, getTxHash } from '@substrate/txwrapper-core/lib/core/construct'
import { KeypairType } from '@polkadot/util-crypto/types'
import { DEFAULT_ACCOUNT_TYPE } from '../../base/AccountsCommandBase'
import { u8aToHex } from '@polkadot/util'

export default class SignUnsignedTxCommand extends SignOfflineCommandBase {
  static description = 'Transfer tokens from any of the available accounts'
  static flags = {
    input: IOFlags.input,
    output: flags.string({
      char: 'o',
      required: false,
      description:
        'Path to the file where the JSON with full transaction details should be saved.' +
        'If omitted, only the signed transaction, the signature and the tx hash is included',
    }),
    mnemonic: flags.string({
      required: false,
      description: 'Mnemonic phrase',
      exclusive: ['backupFilePath', 'seed', 'suri'],
    }),
    seed: flags.string({
      required: false,
      description: 'Secret seed',
      exclusive: ['backupFilePath', 'mnemonic', 'suri'],
    }),
    backupFilePath: flags.string({
      required: false,
      description: 'Path to account backup JSON file',
      exclusive: ['mnemonic', 'seed', 'suri'],
    }),
    suri: flags.string({
      required: false,
      description: 'Substrate uri',
      exclusive: ['mnemonic', 'seed', 'backupFilePath'],
    }),
    password: flags.string({
      required: false,
      description: `Account password`,
      dependsOn: ['backupFilePath', 'suri'],
    }),
    keypairType: flags.enum<KeypairType>({
      required: false,
      default: DEFAULT_ACCOUNT_TYPE,
      description: `Account type (defaults to ${DEFAULT_ACCOUNT_TYPE})`,
      options: ['sr25519', 'ed25519', 'ecdsa'],
      exclusive: ['backupFilePath'],
    }),
  }

  async run(): Promise<void> {
    const {
      flags: { input, output, mnemonic, seed, backupFilePath, suri, keypairType },
    } = this.parse(SignUnsignedTxCommand)

    ensureOutputFileIsWriteable(output)

    if (!input) {
      this.error('Could not fetch the input json', { exit: ExitCodes.InvalidFile })
    }
    const keyringOptions: KeyringOptions = {
      ss58Format: JOYSTREAM_ADDRESS_PREFIX,
      type: keypairType,
    }
    const inputFile = await this.getInputFromFile(input)
    const keyring = new Keyring(keyringOptions)
    const txSignerAddress = keyring.addFromAddress(inputFile.unsigned.address)

    let signerPair: KeyringPair | undefined

    if (this.isKeyAvailable(keyring, txSignerAddress.address)) {
      this.log('Signer key available in storage')
      signerPair = this.getPair(keyring, txSignerAddress.address) as KeyringPair
    }
    if (mnemonic) {
      signerPair = keyring.addFromMnemonic(mnemonic, {}, keypairType)
    } else if (seed) {
      signerPair = keyring.addFromSeed(Buffer.from(seed), {}, keypairType)
    } else if (suri) {
      signerPair = keyring.addFromUri(suri, {}, keypairType)
    } else if (backupFilePath) {
      const jsonPair = await getInputJson<KeyringPair$Json>(backupFilePath)
      signerPair = keyring.addFromJson(jsonPair)
    } else {
      this.error('Signer key not available in storage, and no input provided', {
        exit: ExitCodes.NoAccountFound,
      })
    }
    this.log(`Signer key ${keyring.encodeAddress(signerPair.address, JOYSTREAM_ADDRESS_PREFIX)} is loaded.`)

    if (signerPair.address !== txSignerAddress.address) {
      this.error(
        `The input provided corresponds to ${signerPair.address}, whereas the signer address is ${txSignerAddress.address}`,
        {
          exit: ExitCodes.NoAccountFound,
        }
      )
    }
    if (signerPair.isLocked) {
      await this.requestPairDecoding(signerPair)
    }

    const metadata = inputFile.unsigned.metadataRpc.slice(2)
    await waitReady()

    const signingPayloadDecoded = decodeSigningPayload(inputFile.signingPayload, {
      metadataRpc: `0x${metadata}`,
      registry,
    })
    if (signingPayloadDecoded.method.pallet === 'multisig' && inputFile.multisigTxData) {
      this.multiCheck(signerPair.address, signingPayloadDecoded, inputFile.multisigTxData)
    }
    const encodePayload = await this.createPayloadV4(inputFile.signingPayload)
    const signature = u8aToHex(encodePayload.sign(signerPair))

    const signedTx = createSignedTx(inputFile.unsigned, signature, { metadataRpc: `0x${metadata}`, registry })

    const txInfo = decodeSignedTx(signedTx, { metadataRpc: `0x${metadata}`, registry })
    const txHash = getTxHash(signedTx)

    const outputJson = {
      signedTx,
      signature,
      unsignedTransaction: inputFile.unsigned,
      signingPayload: inputFile.signingPayload,
      txInfo,
      txHash,
    }

    this.log(`The transaction has been signed.\n` + ` - Signature: ${signature}\n` + ` - TX Hash: ${txHash}\n`)
    if (signedTx.length > 500) {
      this.log(`The signed TX too long to log to console - see output file`)
    } else {
      this.log(` - Signed TX: ${signedTx}`)
    }

    if (output) {
      saveOutputJsonToFile(output, outputJson)
    }
  }
}
