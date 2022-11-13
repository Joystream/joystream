import {
  channelPayoutProof,
  prepareClaimChannelRewardExtrinsicArgs,
  verifyChannelPayoutProof,
} from '@joystream/js/content'
import BN from 'bn.js'
import chalk from 'chalk'
import UploadCommandBase from '../../base/UploadCommandBase'
import ExitCodes from '../../ExitCodes'

export default class ClaimChannelReward extends UploadCommandBase {
  static description = 'Claim channel payout reward for a given channel id.'
  static args = [
    {
      name: 'channelId',
      required: true,
      description: 'ID of the Channel',
    },
  ]

  async run(): Promise<void> {
    const { channelId } = this.parse(ClaimChannelReward).args

    // Context
    const channel = await this.getApi().channelById(channelId)
    const [actor, address] = await this.getChannelOwnerActor(channel)
    const keypair = await this.getDecodedPair(address)

    const storageNodeInfo = await this.getRandomActiveStorageNodeInfo('static:council')
    if (!storageNodeInfo) {
      this.error('No active storage node found')
    }

    const commitment = (await this.getOriginalApi().query.content.commitment()).toString()
    const [{ payloadDataObject }] = await this.getQNApi().getChannelPayoutsUpdatedEventByCommitment(commitment)
    const payoutProof = await channelPayoutProof(
      'URL',
      `${storageNodeInfo.apiEndpoint}/files/${payloadDataObject.id}`,
      Number(channelId)
    )
    const maxCashoutAllowed = await this.getOriginalApi().query.content.maxCashoutAllowed()
    const minCashoutAllowed = await this.getOriginalApi().query.content.minCashoutAllowed()
    const cashout = new BN(payoutProof.cumulativeRewardEarned).sub(channel.cumulativeRewardClaimed)

    if (maxCashoutAllowed.lt(cashout)) {
      this.error('Channel cashout amount is too high to be claimed', { exit: ExitCodes.InvalidInput })
    }
    if (minCashoutAllowed.gt(cashout)) {
      this.error('Channel cashout amount is too low to be claimed', { exit: ExitCodes.InvalidInput })
    }
    if (verifyChannelPayoutProof(payoutProof) !== commitment) {
      this.error('Invalid channel payout proof ', { exit: ExitCodes.InvalidInput })
    }

    // Prepare extrinsic arguments
    const { pullPayment, proofElements } = prepareClaimChannelRewardExtrinsicArgs(payoutProof)

    this.jsonPrettyPrint(JSON.stringify({ channelId }))

    await this.requireConfirmation('Do you confirm the provided input?', true)

    const result = await this.sendAndFollowNamedTx(keypair, 'content', 'claimChannelReward', [
      actor,
      proofElements,
      pullPayment,
    ])

    const channelRewardUpdatedEvent = this.findEvent(result, 'content', 'ChannelRewardUpdated')
    const reward = channelRewardUpdatedEvent!.data[0]
    this.log(
      chalk.green(
        `Reward amount  ${chalk.cyanBright(
          reward.toString()
        )} successfully claimed by channel with Id ${chalk.cyanBright(channelId.toString())} !`
      )
    )
  }
}
