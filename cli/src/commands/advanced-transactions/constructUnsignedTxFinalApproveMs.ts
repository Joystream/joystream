import { flags } from '@oclif/command'
import { blake2AsHex } from '@polkadot/util-crypto'
import AdvancedTransactionsCommandBase from '../../base/AdvancedTransactionsCommandBase'
import { Call } from '@polkadot/types/interfaces'
import { registry } from '@joystream/types'
import { OptionsWithMeta } from '@substrate/txwrapper-core'
import { ensureOutputFileIsWriteable, getInputJson, IOFlags } from '../../helpers/InputOutput'
import { MultiSigApproveAsMulti } from '@substrate/txwrapper-substrate/lib/methods/multisig'
import { formatBalance } from '@polkadot/util'
import ExitCodes from '../../ExitCodes'

export default class ConstructUnsignedTxFinalApproveMsCommand extends AdvancedTransactionsCommandBase {
  static description = 'Final approval of a transaction from a multisig account, as initiated by another signer.'

  static flags = {
    input: IOFlags.input,
    addressSigner: flags.string({
      required: true,
      description: 'The address of the signer that is approving the multisig transaction.',
    }),
    output: flags.string({
      char: 'o',
      required: true,
      description: 'Path to the file where the output JSON should be saved.',
    }),
    call: flags.string({
      required: true,
      description: 'The hex-encoded call that is to be executed by the multisig if successfull.',
    }),
    addressMs: flags.string({
      required: false,
      description: 'The address of the multisig that is performing the transaction.',
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
    timepointHeight: flags.integer({
      description:
        'Reference to the blockheight of the transaction that initiated the multisig transaction. Ignored if "input" is provided.',
    }),
    timepointIndex: flags.integer({
      description: 'Reference to the extrinsic index in the "timepointHeight block. Ignored if "input" is provided.',
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
    let {
      input,
      addressSigner,
      output,
      addressMs,
      others,
      call,
      threshold,
      timepointHeight,
      timepointIndex,
      nonceIncrement,
      lifetime,
      tip,
    } = this.parse(ConstructUnsignedTxFinalApproveMsCommand).flags

    ensureOutputFileIsWriteable(output)

    const decodedCall: Call = this.createType('Call', call)
    const fetchedWeight = await this.getWeight(decodedCall)
    const callHash: string = blake2AsHex(call)

    const args = await this.getFinalMsInputs(
      input,
      threshold,
      timepointHeight,
      timepointIndex,
      others,
      call,
      fetchedWeight
    )
    const txMethod = {
      args,
      name: 'asMulti',
      pallet: 'multisig',
    }
    let thresholddNumber: number
    if (args.threshold) {
      thresholddNumber = parseInt(args.threshold.toString())
    } else {
      this.error('Missing required "threshold" input', { exit: ExitCodes.InvalidInput })
    }

    const multiAddress = await this.getMsAddress(thresholddNumber, args.otherSignatories as string[], addressSigner)

    const accBalances = await this.getApi().getAccountsBalancesInfo([multiAddress])

    if (addressMs) {
      this.log(
        `You are approving a multisig transaction from ${multiAddress}, with balances:\n` +
          ` - free: ${formatBalance(accBalances[0].freeBalance)}\n` +
          ` - available: ${formatBalance(accBalances[0].availableBalance)}\n` +
          `If the multisig approves, the transaction will execute:\n` +
          ` - module:method -  ${decodedCall.section}:${decodedCall.method}\n` +
          ` - ${decodedCall.argsEntries.toString()}\n`
      )
    }

    const multisigTxData = {
      call,
      callHash,
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
