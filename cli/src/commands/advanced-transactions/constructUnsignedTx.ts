import { flags } from '@oclif/command'
import { blake2AsHex } from '@polkadot/util-crypto'
import AdvancedTransactionsCommandBase from '../../base/AdvancedTransactionsCommandBase'
import { registry } from '@joystream/types'
import { OptionsWithMeta } from '@substrate/txwrapper-core'
import { ensureOutputFileIsWriteable } from '../../helpers/InputOutput'

export default class CreateUnsignedTxCommand extends AdvancedTransactionsCommandBase {
  static description = 'Create any unsigned transaction, for signing offline.'

  static flags = {
    address: flags.string({
      required: true,
      description: 'The address that is performing the transaction.',
    }),
    module: flags.string({
      required: true,
      description: 'The module of the extrinsic',
    }),
    method: flags.string({
      required: true,
      description: 'The method of the extrinsic',
    }),
    output: flags.string({
      required: true,
      description: 'Path to the file where the output JSON should be saved.',
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

  async run(): Promise<void> {
    const { address, module, method, lifetime, tip, nonceIncrement, output } = this.parse(CreateUnsignedTxCommand).flags

    ensureOutputFileIsWriteable(output)

    const unsignedMethod = await this.promptForTxMethod(module, method)

    const txInfo = await this.getTxInfo(address, unsignedMethod, nonceIncrement, lifetime, tip)

    const optionsWithMeta: OptionsWithMeta = {
      metadataRpc: `0x${txInfo.metadataRpc.slice(2)}`,
      registry,
    }

    const unsigned = await this.getDefinedMethod(txInfo, optionsWithMeta)

    const call = unsigned.method
    const callHash: string = blake2AsHex(call)
    const txData = {
      call,
      callHash,
    }

    this.createTransactionReadyForSigning(unsigned, output, txData)
  }
}
