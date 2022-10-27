import { flags } from '@oclif/command'
import { TxMethod, OptionsWithMeta, Args } from '@substrate/txwrapper-core'
import AdvancedTransactionsCommandBase from '../../base/AdvancedTransactionsCommandBase'
import { ensureOutputFileIsWriteable, saveOutputJsonToFile } from '../../helpers/InputOutput'
import { blake2AsHex } from '@polkadot/util-crypto'
import { registry } from '@joystream/types'
import { ApiMethodArg } from '../../Types'
import chalk from 'chalk'

export default class ConstructWrappedTxCallCommand extends AdvancedTransactionsCommandBase {
  static description = 'Construct a wrapped transaction call.'
  static flags = {
    address: flags.string({
      required: true,
      description: 'The address that is performing the (final) transaction.',
    }),
    module: flags.string({
      required: true,
      description: 'The module (a.k.a. section) of the extrinsic',
    }),
    method: flags.string({
      required: true,
      description: 'The method of the extrinsic',
    }),
    output: flags.string({
      char: 'o',
      required: true,
      description: 'Path to the file where the output JSON should be saved.',
    }),
    fullOutput: flags.string({
      required: false,
      description: 'Path to the file where the full output should be saved',
    }),
    inputCall: flags.string({
      required: false,
      description: 'The hex-encoded call that is to be executed by the multisig if successfull.',
      exactlyOne: ['inputCallFile', 'inputCall'],
    }),
    inputCallFile: flags.string({
      required: false,
      description:
        'Path to a JSON file with the hex-encoded call that is to be executed by the multisig if successfull.',
      exactlyOne: ['inputCallFile', 'inputCall'],
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
    const { address, output, fullOutput, module, method, inputCall, inputCallFile, nonceIncrement, lifetime, tip } =
      this.parse(ConstructWrappedTxCallCommand).flags

    ensureOutputFileIsWriteable(output)

    const callInput = await this.getCallInput(inputCall, inputCallFile)

    const getParams = await this.promptForExtrinsicArgs(module, method)

    const args: Args = {}
    for (const param of getParams) {
      if (param.argName === 'call') {
        args[param.argName] = callInput
      } else {
        const value: ApiMethodArg = await this.promptForParam(param.argType)
        args[param.argName] = value.toString()
      }
    }

    const unsignedMethod: TxMethod = {
      args: args,
      name: method,
      pallet: module,
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

    try {
      saveOutputJsonToFile(output, unsignedTxData)
      this.log(chalk.green(`Output successfully saved in: ${chalk.magentaBright(output)}!`))
    } catch (e) {
      this.warn(`Could not save output to ${output}!`)
    }

    this.log(`The callhash is: ${callHash}`)

    if (call.length > 500) {
      this.log(`Call too long to log to console - see output file`)
    } else {
      this.log(`Call: ${call}`)
    }

    if (fullOutput) {
      ensureOutputFileIsWriteable(fullOutput)
      try {
        saveOutputJsonToFile(fullOutput, unsigned)
        this.log(chalk.green(`Output successfully saved in: ${chalk.magentaBright(fullOutput)}!`))
      } catch (e) {
        this.warn(`Could not save output to ${fullOutput}!`)
      }
    }
  }
}
