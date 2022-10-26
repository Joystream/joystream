import { flags } from '@oclif/command'
import { TxMethod, OptionsWithMeta } from '@substrate/txwrapper-core'
import AdvancedTransactionsCommandBase from '../../base/AdvancedTransactionsCommandBase'
import { ensureOutputFileIsWriteable, saveOutputJsonToFile } from '../../helpers/InputOutput'
import { blake2AsHex } from '@polkadot/util-crypto'
import { registry } from '@joystream/types'

export default class CreateSetCodeCallCommand extends AdvancedTransactionsCommandBase {
  static description = 'Construct a wrapped transaction call.'
  static flags = {
    wasmPath: flags.string({
      required: true,
      description: 'The address that is performing the final call.',
    }),
    address: flags.string({
      required: true,
      description: 'The address that is performing the final call.',
    }),
    output: flags.string({
      char: 'o',
      required: true,
      description: 'Path to the file where the call should be saved',
    }),
    codeOutput: flags.string({
      required: false,
      description: 'Path to where the parsed wasm code shold be saved.',
    }),
    lifetime: flags.integer({
      required: false,
      description:
        'Lifetime of the transaction, from creation to included on chain, in blocks before it becomes invalid.',
      default: 64,
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
    let { wasmPath, address, output, codeOutput, nonceIncrement, lifetime, tip } =
      this.parse(CreateSetCodeCallCommand).flags

    ensureOutputFileIsWriteable(output)

    const code = await this.parseWasm(wasmPath)

    const outCode = {
      code: `0x${code}`,
    }

    const unsignedMethod: TxMethod = {
      args: {
        code: `0x${code}`,
      },
      name: 'setCode',
      pallet: 'system',
    }

    const txInfo = await this.getTxInfo(address, unsignedMethod, nonceIncrement, lifetime, tip)

    const optionsWithMeta: OptionsWithMeta = {
      metadataRpc: `0x${txInfo.metadataRpc.slice(2)}`,
      registry,
    }

    const unsigned = await this.getDefinedMethod(txInfo, optionsWithMeta)

    const call = unsigned.method
    const callHash: string = blake2AsHex(call)
    const unsignedTxData = {
      call,
    }

    saveOutputJsonToFile(output, unsignedTxData)
    this.log(`Call has callhash ${callHash}`)
    if (codeOutput) {
      ensureOutputFileIsWriteable(codeOutput)
      saveOutputJsonToFile(codeOutput, outCode)
    }
  }
}
