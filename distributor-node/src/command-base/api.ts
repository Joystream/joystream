import DefaultCommandBase from './default'
import { CLIError } from '@oclif/errors'
import { SubmittableResult } from '@polkadot/api'
import { KeyringPair } from '@polkadot/keyring/types'
import chalk from 'chalk'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { formatBalance } from '@polkadot/util'
import { ExtrinsicFailedError, RuntimeApi } from '../services/networking/runtime/api'
import ExitCodes from './ExitCodes'

/**
 * Abstract base class for commands that require access to the API.
 */
export default abstract class ApiCommandBase extends DefaultCommandBase {
  protected api!: RuntimeApi

  async init(): Promise<void> {
    await super.init()
    this.api = await RuntimeApi.create(this.logging, this.appConfig.endpoints.joystreamNodeWs)
  }

  async sendAndFollowTx(account: KeyringPair, tx: SubmittableExtrinsic<'promise'>): Promise<SubmittableResult> {
    // Calculate fee and ask for confirmation
    const fee = await this.api.estimateFee(account, tx)

    await this.requireConfirmation(
      `Tx fee of ${chalk.cyan(formatBalance(fee))} will be deduced from you account, do you confirm the transfer?`
    )

    try {
      const res = await this.api.sendExtrinsic(account, tx)
      return res
    } catch (e) {
      if (e instanceof ExtrinsicFailedError) {
        throw new CLIError(`Extrinsic failed! ${e.message}`, { exit: ExitCodes.ApiError })
      }
      throw e
    }
  }
}
