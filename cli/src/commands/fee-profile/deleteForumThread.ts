import { formatBalance } from '@polkadot/util'
import chalk from 'chalk'
import FeeProfileCommandBase from '../../base/FeeProfileCommandBase'

export default class FeeProfileDeleteForumThread extends FeeProfileCommandBase {
  static description = 'Create fee profile of forum.delete_thread extrinsic.'

  static flags = {
    ...super.flags,
  }

  async run(): Promise<void> {
    const api = await this.getOriginalApi()
    const { threadDeposit } = api.consts.forum

    this.log(`Thread deposit: ${chalk.cyanBright(formatBalance(threadDeposit))}`)

    const tx = api.tx.forum.deleteThread(0, 0, 0, true)
    const txFee = await this.getApi().estimateFee(this.pairs.alice, tx)
    const costs = {
      txFee,
    }
    const returns = {
      threadDeposit,
    }
    this.profile(costs, returns)
  }
}
