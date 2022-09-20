import FeeProfileCommandBase from '../../base/FeeProfileCommandBase'
import { flags } from '@oclif/command'
import _ from 'lodash'
import { formatBalance } from '@polkadot/util'
import chalk from 'chalk'

const DEFAULT_POST_LENGTH = 200

export default class FeeProfileAddForumPost extends FeeProfileCommandBase {
  static description = 'Create fee profile of forum.add_post extrinsic.'

  static flags = {
    postLen: flags.integer({
      char: 'p',
      default: DEFAULT_POST_LENGTH,
      description: 'Post length to use for estimating tx fee',
    }),
    editable: flags.boolean({
      char: 'e',
      description: 'If specified - `editable` parameter is set to true when estimating the costs',
    }),
    ...super.flags,
  }

  async run(): Promise<void> {
    const api = this.getOriginalApi()
    const { postLen, editable = false } = this.parse(FeeProfileAddForumPost).flags
    const { postDeposit } = api.consts.forum

    this.log(`Post deposit: ${chalk.cyanBright(formatBalance(postDeposit))}`)
    this.log('Parameters:')
    this.jsonPrettyPrint(JSON.stringify({ postLen, editable }))

    const tx = api.tx.forum.addPost(0, 0, 0, _.repeat('x', postLen), editable)
    const txFee = await this.getApi().estimateFee(this.pairs.alice, tx)
    this.profile(
      editable
        ? {
            txFee,
            postDeposit,
          }
        : { txFee }
    )
  }
}
