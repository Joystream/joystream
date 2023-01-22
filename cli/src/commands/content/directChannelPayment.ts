import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import { metadataToString } from '../../helpers/serialization'
import { MakeChannelPayment, MemberRemarked } from '@joystream/metadata-protobuf'
import MemberRemarkCommand from '../membership/memberRemark'
import { flags } from '@oclif/command'
import UploadCommandBase from '../../base/UploadCommandBase'
import ExitCodes from '../../ExitCodes'
import Long from 'long'

export default class DirectChannelPaymentCommand extends ContentDirectoryCommandBase {
  static description = `Make direct payment to channel's reward account by any member .`
  static flags = {
    context: ContentDirectoryCommandBase.channelCreationContextFlag,
    rewardAccount: flags.string({
      description: 'Reward account of the channel to be paid',
      exclusive: ['channel'],
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
    paymentContext: flags.build({
      parse: DirectChannelPaymentCommand.parsePaymentContext,
    })({
      char: 'p',
      description: `Context of payment, if it is being made for a specific video or as channel wide tip
      - payment context Formant: 'channel' or 'video:{videoId}'
      - default: 'channel'
      Examples:
      - 'channel' - payment is being made for the whole channel
      - 'video:4' - payment is being made for video with id 4 under given channel`,
    }),

    ...UploadCommandBase.flags,
  }

  private static parsePaymentContext(input: 'channel' | `video:${number}`): { videoId: string } | undefined {
    return input === 'channel' ? undefined : { videoId: input.split(':')[1] }
  }

  async run(): Promise<void> {
    const { rewardAccount, channelId, amount, rationale, paymentContext } =
      this.parse(DirectChannelPaymentCommand).flags

    const channel = channelId
      ? await this.getQNApi().getChannelById(channelId)
      : await this.getQNApi().getChannelByRewardAccount(rewardAccount!)
    if (!channel) {
      this.error(`Channel with reward account ${rewardAccount} does not exist`, { exit: ExitCodes.InvalidInput })
    }

    let channelContext
    let videoContext
    if (!paymentContext) {
      channelContext = Long.fromString(channel.id)
    } else {
      const video = await this.getApi().videoById(paymentContext.videoId)
      if (video.inChannel.toString() !== channel.id) {
        this.error(`Video with id ${paymentContext.videoId} does not exist in payee channel`, {
          exit: ExitCodes.InvalidInput,
        })
      }
      videoContext = Long.fromString(paymentContext.videoId)
    }

    const meta = new MemberRemarked({
      makeChannelPayment: new MakeChannelPayment({
        videoId: videoContext,
        channelId: channelContext,
        rationale,
      }),
    })

    const metaMessage = metadataToString(MemberRemarked, meta)
    await MemberRemarkCommand.run([metaMessage, '--account', channel.rewardAccount, '--amount', amount])
  }
}
