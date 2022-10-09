import { flags } from '@oclif/command'
import { blake2AsHex } from '@polkadot/util-crypto'
import AdvancedTransactionsCommandBase from '../../base/AdvancedTransactionsCommandBase'
import { Call } from '@polkadot/types/interfaces'
import { registry } from '@joystream/types'
import { OptionsWithMeta, TxMethod } from '@substrate/txwrapper-core'
import { ensureOutputFileIsWriteable, getInputJson, IOFlags } from '../../helpers/InputOutput'
import { MultiSigApproveAsMulti } from '@substrate/txwrapper-substrate/lib/methods/multisig'
import { formatBalance } from '@polkadot/util'

export default class ConstructUnsignedTxInitiateMsCommand extends AdvancedTransactionsCommandBase {
  static description = 'Initiate a call (transaction) from a multisig account, as the first signer.'

  static flags = {
    input: IOFlags.input,
    addressSigner: flags.string({
      required: true,
      description: 'The address of the signer that is initiating the multisig transaction.',
    }),
    output: flags.string({
      char: 'o',
      required: true,
      description: 'Path to the file where the output JSON should be saved.',
    }),
    addressMs: flags.string({
      required: false,
      description: 'The address of the multisig that is performing the transaction.',
    }),
    call: flags.string({
      required: true,
      description: 'The hex-encoded call that is to be executed by the multisig if successfull.',
    }),
    others: flags.string({
      required: false,
      description:
        'Comma separated list of the accounts (other than the addressSigner) who can approve this call. Ignored if "input" is provided.',
    }),
    threshold: flags.integer({
      description:
        'How many (m) of the n signatories (signer+others), are required to sign/approve the transaction. Ignored if "input" is provided.',
    }),
    lifetime: flags.integer({
      required: false,
      description:
        'Lifetime of the transaction, from constructed to included in a block, in blocks before it becomes invalid. Must be a power of two between 4 and 65536',
    }),
    tip: flags.integer({
      required: false,
      default: 0,
      description: 'Optional "tip" (in base value) for faster block inclusion.',
    }),
    nonceIncrement: flags.integer({
      required: false,
      default: 0,
      description:
        'If you are preparing multiple transactions from the samme account, before broadcasting them, you need to increase the nonce by 1 for each. This value will be added to the nonce read from the chain.',
    }),
  }
  async getInputFromFile(filePath: string): Promise<MultiSigApproveAsMulti> {
    return getInputJson<MultiSigApproveAsMulti>(filePath)
  }

  async run(): Promise<void> {
    let { input, addressSigner, output, addressMs, others, call, threshold, nonceIncrement, lifetime, tip } =
      this.parse(ConstructUnsignedTxInitiateMsCommand).flags

    ensureOutputFileIsWriteable(output)

    const decodedCall: Call = this.createType('Call', call)
    const fetchedWeight = await this.getWeight(decodedCall)
    const callHash: string = blake2AsHex(call)

    const args = await this.getInitMsInputs(input, threshold, others, callHash, fetchedWeight)
    const multiAddress = await this.getMsAddress(
      parseInt(args.threshold.toString()),
      args.otherSignatories as string[],
      addressSigner
    )
    const accBalances = await this.getApi().getAccountsBalancesInfo([multiAddress])

    if (addressMs) {
      if (multiAddress != addressMs) {
        await this.requireConfirmation(
          `The input sender account, addressMs: ${addressMs},` +
            `does not match the account calculated from signer + others: ${multiAddress}` +
            `Do you wish to continue?`
        )
      }
    }

    this.log(
      `You are initiating a multisig transaction from ${multiAddress}, with balances:\n` +
        ` - free: ${formatBalance(accBalances[0].freeBalance)}\n` +
        ` - available: ${formatBalance(accBalances[0].availableBalance)}\n` +
        `If the multisig approves, the transaction will execute:\n` +
        ` - module:method -  ${decodedCall.section}:${decodedCall.method}\n` +
        ` - ${decodedCall.argsEntries.toString()}\n`
    )

    const multisigTxData = {
      call,
      callHash,
    }

    const txMethod: TxMethod = {
      args,
      name: 'approveAsMulti',
      pallet: 'multisig',
    }
    const txInfo = await this.getTxInfo(addressSigner, txMethod, nonceIncrement, lifetime, tip)
    const optionsWithMeta: OptionsWithMeta = {
      metadataRpc: `0x${txInfo.metadataRpc.slice(2)}`,
      registry,
    }
    const unsigned = await this.getDefinedMethod(txInfo, optionsWithMeta)

    const unsignedCall = unsigned.method
    const unsignedCallHash: string = blake2AsHex(unsignedCall)
    const unsignedTxData = {
      call: unsignedCall,
      callHash: unsignedCallHash,
    }

    await this.createTransactionReadyForSigning(unsigned, output, unsignedTxData, multisigTxData)
  }
}
