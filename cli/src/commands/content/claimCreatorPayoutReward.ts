import { CreatorPayoutPayload } from '@joystream/metadata-protobuf'
import { createType } from '@joystream/types'
import { ProofElement, PullPayment, Side } from '@joystream/types/content'
import { creatorPayoutRecord, generateProof } from '@joystreamjs/content'
import { Vec } from '@polkadot/types'
import { blake2AsU8a } from '@polkadot/util-crypto'
import chalk from 'chalk'
import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import ExitCodes from '../../ExitCodes'

export default class ClaimCreatorPayoutReward extends ContentDirectoryCommandBase {
  static description = 'Claim creator payout reward for a given channel id.'
  static args = [
    {
      name: 'channelId',
      required: true,
      description: 'ID of the Channel',
    },
  ]

  async run(): Promise<void> {
    const { channelId } = this.parse(ClaimCreatorPayoutReward).args

    // Context
    const channel = await this.getApi().channelById(channelId)
    const [actor, address] = await this.getChannelOwnerActor(channel)
    const keypair = await this.getDecodedPair(address)

    const payoutRecord = await creatorPayoutRecord(channelId)
    if (payoutRecord.cumulativePayoutOwed > this.getOriginalApi().consts.content.maxRewardAllowed.toNumber()) {
      this.error('Cumulative payout owed to channel exceeds the max reward allowed', { exit: ExitCodes.InvalidInput })
    }
    if (payoutRecord.cumulativePayoutOwed < this.getOriginalApi().consts.content.minCashoutAllowed.toNumber()) {
      this.error('Not sufficient Cashout Amount', { exit: ExitCodes.InvalidInput })
    }

    if (generateProof(payoutRecord) !== this.getOriginalApi().consts.content.commitment.toU8a()) {
      this.error('Not sufficient Cashout Amount', { exit: ExitCodes.InvalidInput })
    }

    // Prepare extrinsic arguments
    const pullPayment = createType<PullPayment, 'PullPayment'>('PullPayment', {
      channel_id: channelId,
      cumulative_payout_claimed: payoutRecord.cumulativePayoutOwed,
      // TODO: double-check hash function to use: blake2AsU8a vs blake2AsHex
      reason: blake2AsU8a(payoutRecord.payoutRationale),
    })

    const merkleProof = [] as unknown as Vec<ProofElement>
    payoutRecord.merkleBranches.forEach((m) => {
      const side =
        m.side === CreatorPayoutPayload.Body.CreatorPayout.Side.Left
          ? createType<Side, 'Side'>('Side', { Left: null })
          : createType<Side, 'Side'>('Side', { Right: null })
      const merkleBranch = createType<ProofElement, 'ProofElement'>('ProofElement', { hash: m.merkleBranch, side })
      merkleProof.push(merkleBranch)
    })

    this.jsonPrettyPrint(JSON.stringify({ channelId }))

    await this.requireConfirmation('Do you confirm the provided input?', true)

    const result = await this.sendAndFollowNamedTx(keypair, 'content', 'claimChannelReward', [
      actor,
      merkleProof,
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
