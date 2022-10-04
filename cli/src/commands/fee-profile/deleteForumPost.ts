import FeeProfileCommandBase from '../../base/FeeProfileCommandBase'
import _ from 'lodash'
import { flags } from '@oclif/command'
import { createType } from '@joystream/types'
import chalk from 'chalk'
import { formatBalance } from '@polkadot/util'

const DEFAULT_RATIONALE_LENGTH = 0

export default class FeeProfileDeleteForumPost extends FeeProfileCommandBase {
  static description = 'Create fee profile of forum.delete_posts extrinsic (single post case).'

  static flags = {
    rationaleLen: flags.integer({
      char: 'r',
      default: DEFAULT_RATIONALE_LENGTH,
      description: 'Default rationale length to use for estimating tx fee',
    }),
    ...super.flags,
  }

  async run(): Promise<void> {
    const api = this.getOriginalApi()
    const { postDeposit } = api.consts.forum
    const { rationaleLen } = this.parse(FeeProfileDeleteForumPost).flags

    this.log(`Post deposit: ${chalk.cyanBright(formatBalance(postDeposit))}`)
    this.log('Parameters:')
    this.jsonPrettyPrint(JSON.stringify({ rationaleLen }))

    const tx = api.tx.forum.deletePosts(
      0,
      createType(
        'BTreeMap<PalletForumExtendedPostIdObject, bool>',
        new Map([[createType('PalletForumExtendedPostIdObject', { categoryId: 0, threadId: 0, postId: 0 }), true]])
      ),
      _.repeat('x', rationaleLen)
    )
    const txFee = await this.getApi().estimateFee(this.pairs.alice, tx)
    const costs = {
      txFee,
    }
    const returns = {
      postDeposit,
    }
    this.profile(costs, returns)
  }
}
