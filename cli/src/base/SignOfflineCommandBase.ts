import StateAwareCommandBase from './StateAwareCommandBase'
import { NamedKeyringPair, OfflineTransactionData } from '../Types'
import { Keyring } from '@polkadot/api'
import { getInputJson } from '../helpers/InputOutput'
import { KeyringPair } from '@polkadot/keyring/types'
import { GenericExtrinsicPayload, GenericExtrinsicPayloadV4 } from '@polkadot/types'
import { waitReady } from '@polkadot/wasm-crypto'
import { JOYSTREAM_ADDRESS_PREFIX, registry } from '@joystream/types'
import inquirer from 'inquirer'
import { DecodedSigningPayload } from '@substrate/txwrapper-core'
import { MultiSigApproveAsMulti, MultisigAsMulti } from '@substrate/txwrapper-substrate/lib/methods/multisig'
import { blake2AsHex, createKeyMulti, encodeAddress, sortAddresses } from '@polkadot/util-crypto'
import { Timepoint } from '@substrate/txwrapper-substrate/lib/methods/multisig/types'

export default abstract class SignOfflineCommandBase extends StateAwareCommandBase {
  getPair(keyring: Keyring, key: string): NamedKeyringPair {
    return keyring.getPair(key) as NamedKeyringPair
  }

  isKeyAvailable(keyring: Keyring, key: string): boolean {
    return keyring.getPairs().some((p) => p.address === key.toString())
  }

  async createPayload(signingPayload: string): Promise<GenericExtrinsicPayload> {
    await waitReady()
    const payload = registry.createType('ExtrinsicPayload', signingPayload, {
      version: 4,
    })
    return payload
  }

  async createPayloadV4(signingPayload: string): Promise<GenericExtrinsicPayloadV4> {
    await waitReady()
    const payload = registry.createType('ExtrinsicPayloadV4', signingPayload)
    return payload
  }

  async getInputFromFile(filePath: string): Promise<OfflineTransactionData> {
    return getInputJson<OfflineTransactionData>(filePath)
  }

  multiCheck(
    signerAddress: string,
    signingPayloadDecoded: DecodedSigningPayload,
    multisigTxData: { call: string; callHash: string }
  ): void {
    if (signingPayloadDecoded.method.name === 'approveAsMulti') {
      const args = signingPayloadDecoded.method.args as MultiSigApproveAsMulti
      if (blake2AsHex(multisigTxData.call) === args.callHash.toString()) {
        const allSignatories = [...args.otherSignatories]
        allSignatories.push(signerAddress)
        const threshold = parseInt(args.threshold.toString())
        const allSignatoriesSorted = sortAddresses(allSignatories, JOYSTREAM_ADDRESS_PREFIX)
        const multiAddress = encodeAddress(createKeyMulti(allSignatoriesSorted, threshold), JOYSTREAM_ADDRESS_PREFIX)
        if (args.maybeTimepoint == null) {
          this.log(
            `You are initiating (and the first to approve) a multisig transaction from ${multiAddress} as ${signerAddress}.`
          )
          this.log(
            `The setup means ${threshold - 1}/${
              allSignatoriesSorted.length
            } more signer(s) needs to approve in order to execute`
          )
        } else {
          this.log(`You are approving a multisig transaction from ${multiAddress} as ${signerAddress}.`)
          this.log(
            `The transaction you want to approve was included as the ${args.maybeTimepoint.index} in block ${args.maybeTimepoint.height}.`
          )
          this.log(
            `If you are the final signer to approve (meaning ${threshold - 1} of ${
              allSignatoriesSorted.length
            } has approved already), you need to construct the unsigned transaction again with 'constructUnsignedTxApproveMs'`
          )
        }
        this.log(`the encoded call ${multisigTxData.call}`)
      } else {
        this.error(
          `The callHash you want to approve: ${args.callHash.toString()} n\` ` +
            `does not match the encoded call: ${multisigTxData.call}.`
        )
      }
    } else if (signingPayloadDecoded.method.name === 'asMulti') {
      const args = signingPayloadDecoded.method.args as MultisigAsMulti
      const allSignatories = [...(args.otherSignatories as string[])]
      allSignatories.push(signerAddress)
      const threshold = parseInt((args.threshold ?? 1).toString())
      const timepoint = args.maybeTimepoint as Timepoint
      const allSignatoriesSorted = sortAddresses(allSignatories, JOYSTREAM_ADDRESS_PREFIX)
      const multiAddress = encodeAddress(createKeyMulti(allSignatoriesSorted, threshold), JOYSTREAM_ADDRESS_PREFIX)
      if (args.maybeTimepoint != null) {
        this.log(`You are the final approver of a multisig transaction from ${multiAddress} as ${signerAddress}.`)
        this.log(
          `The transaction you want to approve was included as the ${timepoint.index} in block ${timepoint.height}.`
        )
        this.log(
          `If you are not the final signer to approve (meaning ${threshold - 1} of ${
            allSignatoriesSorted.length
          } has approved already), you need to construct the unsigned transaction again with 'constructUnsignedTxFinalApproveMs'`
        )
      } else {
        if (threshold === 1) {
          this.log(
            `You are initiating, and the final/only approver of a multisig transaction from ${multiAddress} as ${signerAddress}.`
          )
        }
        this.error(`Only with an 1/m multisig can you both initiate and be the final approver.`)
      }
      // } else if (signingPayloadDecoded.method.name == "cancelAsMulti") {
      //  ...
    } else {
      this.error(`Not a multisig`)
    }
  }

  async requestPairDecoding(pair: KeyringPair, message?: string): Promise<KeyringPair> {
    // Skip if pair already unlocked
    if (!pair.isLocked) {
      return pair
    }

    // First - try decoding using empty string
    try {
      pair.decodePkcs8('')
      return pair
    } catch (e) {
      // Continue...
    }

    let isPassValid = false
    while (!isPassValid) {
      try {
        const password = await this.promptForPassword(
          message || `Enter ${pair.meta.name ? pair.meta.name : pair.address} account password`
        )
        pair.decodePkcs8(password)
        isPassValid = true
      } catch (e) {
        this.warn('Invalid password... Try again.')
      }
    }
    return pair
  }

  async promptForPassword(message = "Your account's password"): Promise<string> {
    const { password } = await inquirer.prompt([
      {
        name: 'password',
        type: 'password',
        message,
      },
    ])

    return password
  }
}
