import AccountsCommandBase from './AccountsCommandBase'
import {
  defineMethod,
  OptionsWithMeta,
  TxInfo,
  TxMethod,
  BaseTxInfo,
  UnsignedTransaction,
} from '@substrate/txwrapper-core'
import { createSigningPayload } from '@substrate/txwrapper-core/lib/core/construct'
import { Call } from '@polkadot/types/interfaces'
import { JOYSTREAM_ADDRESS_PREFIX, registry } from '@joystream/types'
import chalk from 'chalk'
import { getInputJson, saveOutputJsonToFile } from '../helpers/InputOutput'
import { OfflineTransactionData } from '../Types'
import { MultiSigApproveAsMulti, MultisigAsMulti } from '@substrate/txwrapper-substrate/lib/methods/multisig'
import { Timepoint } from '@substrate/txwrapper-substrate/lib/methods/multisig/types'
import { createKeyMulti, encodeAddress, sortAddresses } from '@polkadot/util-crypto'
import ExitCodes from '../ExitCodes'

export default abstract class AdvancedTransactionsCommandBase extends AccountsCommandBase {
  async getApproveAsMultiInputFromFile(filePath: string): Promise<MultiSigApproveAsMulti> {
    return getInputJson<MultiSigApproveAsMulti>(filePath)
  }

  async getAsMultiInputFromFile(filePath: string): Promise<MultisigAsMulti> {
    return getInputJson<MultisigAsMulti>(filePath)
  }

  async getInputDiff(args: MultiSigApproveAsMulti, argsInput: MultiSigApproveAsMulti, initial: boolean) {
    if (args.callHash != argsInput.callHash) {
      this.error('The call provided does not match the callhash from the input file', { exit: ExitCodes.InvalidInput })
    }
  }

  async getInitMsInputs(
    input: string | undefined,
    threshold: number | undefined,
    others: string | undefined,
    callHash: string,
    maxWeight: number
  ): Promise<MultiSigApproveAsMulti> {
    let argsInput: MultiSigApproveAsMulti
    let otherSignatories: string[] = []
    if (input) {
      argsInput = await this.getApproveAsMultiInputFromFile(input)
      otherSignatories = sortAddresses(argsInput.otherSignatories, JOYSTREAM_ADDRESS_PREFIX)
    } else if (threshold && others) {
      otherSignatories = sortAddresses(others.split(','), JOYSTREAM_ADDRESS_PREFIX)
      argsInput = {
        threshold,
        otherSignatories,
        maybeTimepoint: null,
        callHash,
        maxWeight,
      }
    } else {
      this.error('Missing required input', { exit: ExitCodes.InvalidInput })
    }
    const args: MultiSigApproveAsMulti = {
      threshold: argsInput.threshold,
      otherSignatories,
      maybeTimepoint: null,
      callHash: callHash,
      maxWeight,
    }
    if (argsInput.callHash != args.callHash) {
      this.error(
        `The hash of the input "call": ${args.callHash} does not match the input "callHash" ${argsInput.callHash}.`,
        { exit: ExitCodes.InvalidInput }
      )
    }

    if (argsInput.maxWeight != args.maxWeight) {
      this.warn(`"maxWeight" changed from ${argsInput.maxWeight} to ${args.maxWeight} .`)
    }
    return args
  }

  async getApproveMsInputs(
    input: string | undefined,
    threshold: number | undefined,
    timepointHeight: number | undefined,
    timepointIndex: number | undefined,
    others: string | undefined,
    callHash: string,
    maxWeight: number
  ): Promise<MultiSigApproveAsMulti> {
    let argsInput: MultiSigApproveAsMulti
    let otherSignatories: string[] = []
    if (input) {
      argsInput = await this.getApproveAsMultiInputFromFile(input)
      otherSignatories = sortAddresses(argsInput.otherSignatories, JOYSTREAM_ADDRESS_PREFIX)
    } else if (threshold && others && timepointHeight && timepointIndex) {
      otherSignatories = sortAddresses(others.split(','), JOYSTREAM_ADDRESS_PREFIX)
      const maybeTimepoint: Timepoint = {
        height: timepointHeight,
        index: timepointIndex,
      }
      argsInput = {
        threshold,
        otherSignatories,
        maybeTimepoint,
        callHash,
        maxWeight,
      }
    } else {
      this.error('Missing required input', { exit: ExitCodes.InvalidInput })
    }
    const args: MultiSigApproveAsMulti = {
      threshold: parseInt(argsInput.threshold.toString()),
      otherSignatories,
      maybeTimepoint: argsInput.maybeTimepoint,
      callHash: callHash,
      maxWeight,
    }
    if (argsInput.callHash != args.callHash) {
      this.error(
        `The hash of the input "call": ${args.callHash} does not match the input "callHash" ${argsInput.callHash}.`,
        { exit: ExitCodes.InvalidInput }
      )
    }

    if (argsInput.maxWeight != args.maxWeight) {
      this.warn(`"maxWeight" changed from ${argsInput.maxWeight} to ${args.maxWeight} .`)
    }
    return args
  }

  async getFinalMsInputs(
    input: string | undefined,
    threshold: number | undefined,
    timepointHeight: number | undefined,
    timepointIndex: number | undefined,
    others: string | undefined,
    call: string,
    maxWeight: number
  ): Promise<MultisigAsMulti> {
    let argsInput: MultisigAsMulti
    let args: MultisigAsMulti
    let otherSignatories: string[] = []
    if (input) {
      argsInput = await this.getAsMultiInputFromFile(input)
      const others = argsInput.otherSignatories as string[]
      otherSignatories = sortAddresses(others, JOYSTREAM_ADDRESS_PREFIX)
      args = argsInput
      args.otherSignatories = otherSignatories
      args.maxWeight = maxWeight
      if (args != argsInput) {
        await this.requireConfirmation(
          `Some file inputs have been overridden:` + `args from file input: ${argsInput}` + `new args: ${args}`
        )
      }
    } else if (threshold && others && timepointHeight && timepointIndex) {
      otherSignatories = sortAddresses(others.split(','), JOYSTREAM_ADDRESS_PREFIX)
      const maybeTimepoint: Timepoint = {
        height: timepointHeight,
        index: timepointIndex,
      }
      args = {
        threshold,
        otherSignatories,
        maybeTimepoint,
        call,
        storeCall: false,
        maxWeight,
      }
    } else {
      this.error('Missing required input', { exit: ExitCodes.InvalidInput })
    }
    return args
  }

  async getBaseTxInfo(
    account: string,
    nonceIncrement: number,
    eraPeriod: number | undefined,
    tip: number | undefined
  ): Promise<BaseTxInfo> {
    const genesisHash = (await this.getOriginalApi().rpc.chain.getBlockHash(0)).toString()
    const blockHash = (await this.getOriginalApi().rpc.chain.getFinalizedHead()).toString()
    const blockNumber = (await this.getOriginalApi().rpc.chain.getHeader(blockHash)).number.toNumber()
    const metadata = (await this.getOriginalApi().rpc.state.getMetadata(blockHash)).toHex().slice(2)
    const version = await this.getOriginalApi().rpc.state.getRuntimeVersion()
    const accountData = await this.getOriginalApi().query.system.account(account)
    const baseTxInfo: BaseTxInfo = {
      address: account,
      blockHash,
      blockNumber,
      genesisHash,
      metadataRpc: `0x${metadata}`,
      nonce: accountData.nonce.toNumber() + nonceIncrement,
      specVersion: version.specVersion.toNumber(),
      tip,
      eraPeriod,
      transactionVersion: version.transactionVersion.toNumber(),
    }
    return baseTxInfo
  }

  async getTxInfo(
    account: string,
    method: TxMethod,
    nonceIncrement: number,
    eraPeriod: number | undefined,
    tip: number
  ): Promise<TxInfo> {
    const genesisHash = (await this.getOriginalApi().rpc.chain.getBlockHash(0)).toString()
    const blockHash = (await this.getOriginalApi().rpc.chain.getFinalizedHead()).toString()
    const blockNumber = (await this.getOriginalApi().rpc.chain.getHeader(blockHash)).number.toNumber()
    const metadata = (await this.getOriginalApi().rpc.state.getMetadata(blockHash)).toHex().slice(2)
    const version = await this.getOriginalApi().rpc.state.getRuntimeVersion()
    const accountData = await this.getOriginalApi().query.system.account(account)
    if (eraPeriod) {
      const ceil = Math.ceil(Math.log2(eraPeriod))
      const floor = Math.floor(Math.log2(eraPeriod))
      if (eraPeriod < 4 || eraPeriod > 65536 || ceil != floor) {
        this.error(`Invalid "lifetime" input.`, { exit: ExitCodes.InvalidInput })
      }
    }
    const txInfo: TxInfo = {
      address: account,
      blockHash,
      blockNumber,
      genesisHash,
      metadataRpc: `0x${metadata}`,
      nonce: accountData.nonce.toNumber() + nonceIncrement,
      specVersion: version.specVersion.toNumber(),
      tip,
      eraPeriod,
      transactionVersion: version.transactionVersion.toNumber(),
      method,
    }
    return txInfo
  }

  async getMsAddress(threshold: number, others: string[], signer?: string): Promise<string> {
    const allSignatories = [...others]
    if (signer) {
      allSignatories.push(signer)
    }
    const msAddress = encodeAddress(
      createKeyMulti(sortAddresses(allSignatories, JOYSTREAM_ADDRESS_PREFIX), threshold),
      JOYSTREAM_ADDRESS_PREFIX
    )
    return msAddress
  }

  async getDefinedMethod(txInfo: TxInfo, optionsWithMeta: OptionsWithMeta): Promise<UnsignedTransaction> {
    const unsigned = defineMethod(txInfo, optionsWithMeta)
    return unsigned
  }

  async getWeight(call: Call): Promise<number> {
    const callData = this.getOriginalApi().tx(call)
    const paymentWeight = await this.getOriginalApi().rpc.payment.queryInfo(callData.toHex())
    return paymentWeight.weight.toNumber()
  }

  async createTransactionReadyForSigning(
    unsigned: UnsignedTransaction,
    output: string,
    unsignedTxData: { call: string; callHash: string },
    multisigTxData?: { call: string; callHash: string }
  ) {
    unsigned.signedExtensions.push('CheckEra')
    const signingPayload = createSigningPayload(unsigned, { registry })
    const transactionInputs: OfflineTransactionData = {
      unsigned,
      signingPayload,
      txData: unsignedTxData,
    }
    if (multisigTxData) {
      transactionInputs.multisigTxData = multisigTxData
    }
    try {
      saveOutputJsonToFile(output, transactionInputs)
      this.log(chalk.green(`Output successfully saved in: ${chalk.magentaBright(output)}!`))
    } catch (e) {
      this.warn(`Could not save output to ${output}!`)
    }
  }
}
