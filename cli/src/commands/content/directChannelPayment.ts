import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import { metadataToString } from '../../helpers/serialization'
import { MakeChannelPayment, MemberRemarked } from '@joystream/metadata-protobuf'
import { flags } from '@oclif/command'
import UploadCommandBase from '../../base/UploadCommandBase'
import ExitCodes from '../../ExitCodes'
import Long from 'long'
import chalk from 'chalk'

export default class DirectChannelPaymentCommand extends ContentDirectoryCommandBase {
  static description = `Make direct payment to channel's reward account by any member .`
  static flags = {
    rewardAccount: flags.string({
      description: 'Reward account of the channel to be paid',
      exclusive: ['channelId'],
    }),
    channelId: flags.string({
      description: 'ID of the channel to be paid',
      exclusive: ['rewardAccount'],
    }),
    amount: flags.string({
      required: true,
      description: 'JOY amount to be paid',
    }),
    rationale: flags.string({
      char: 'r',
      required: true,
      description: 'Reason for the payment',
    }),
    videoId: flags.string({
      char: 'v',
      description:
        'video ID for which payment is being made. If not provided, payment is supposed to be a channel wide tip',
    }),
    ...UploadCommandBase.flags,
  }

  async run(): Promise<void> {
    const { rewardAccount, channelId, amount, rationale, videoId } = this.parse(DirectChannelPaymentCommand).flags
    if (!channelId && !rewardAccount) {
      this._help()
      return
    }

    const channel = channelId
      ? await this.getQNApi().getChannelById(channelId)
      : await this.getQNApi().getChannelByRewardAccount(rewardAccount || '')
    if (channelId && !channel) {
      this.error(`Channel with ID ${channelId} does not exist`, { exit: ExitCodes.InvalidInput })
    } else if (!channel) {
      this.error(`Channel with reward account ${rewardAccount} does not exist`, { exit: ExitCodes.InvalidInput })
    }

    if (videoId) {
      const video = await this.getApi().videoById(videoId)
      if (video.inChannel.toString() !== channel.id) {
        this.error(`Video with id ${videoId} does not exist in payee channel`, {
          exit: ExitCodes.InvalidInput,
        })
      }
    }

    const meta = new MemberRemarked({
      makeChannelPayment: new MakeChannelPayment({
        videoId: videoId ? Long.fromString(videoId) : undefined,
        rationale,
      }),
    })

    const message = metadataToString(MemberRemarked, meta)
    const [memberId, controllerAccount, payment] = await this.getValidatedMemberRemarkParams({
      account: channel.rewardAccount,
      amount,
    })
    const keypair = await this.getDecodedPair(controllerAccount)
    const result = await this.sendAndFollowNamedTx(keypair, 'members', 'memberRemark', [memberId, message, payment])

    const [id] = this.getEvent(result, 'members', 'MemberRemarked').data
    this.log(chalk.green(`Member ${id} successfully paid channel ${channelId} with amount ${amount}!`))
  }
}
