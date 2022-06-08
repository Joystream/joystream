import { ChannelPayoutsMetadata } from '@joystream/metadata-protobuf'
import { createType } from '@joystream/types'
import { ProofElement, PullPayment, Side } from '@joystream/types/content'
import { channelPayoutRecord, generateCommitmentFromPayload } from '@joystreamjs/content'
import { Vec } from '@polkadot/types'
import { blake2AsHex } from '@polkadot/util-crypto'
import chalk from 'chalk'
import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import ExitCodes from '../../ExitCodes'

export default class ClaimChannelPayoutReward extends ContentDirectoryCommandBase {
  static description = 'Claim channel payout reward for a given channel id.'
  static args = [
    {
      name: 'channelId',
      required: true,
      description: 'ID of the Channel',
    },
  ]

  async run(): Promise<void> {
    const { channelId } = this.parse(ClaimChannelPayoutReward).args

    // Context
    const channel = await this.getApi().channelById(channelId)
    const [actor, address] = await this.getChannelOwnerActor(channel)
    const keypair = await this.getDecodedPair(address)

    const payoutRecord = await channelPayoutRecord(channelId)
    const maxCashoutAllowed = (await this.getOriginalApi().query.content.maxCashoutAllowed()).toNumber()
    const minCashoutAllowed = (await this.getOriginalApi().query.content.minCashoutAllowed()).toNumber()
    const commitment = await this.getOriginalApi().query.content.commitment()

    if (payoutRecord.cumulativeRewardEarned > maxCashoutAllowed) {
      this.error('Cumulative payout earned by channel exceeds the max cashout allowed', {
        exit: ExitCodes.InvalidInput,
      })
    }
    if (payoutRecord.cumulativeRewardEarned < minCashoutAllowed) {
      this.error('Not sufficient Cashout Amount', { exit: ExitCodes.InvalidInput })
    }

    if (generateCommitmentFromPayload(payoutRecord) !== commitment.toString()) {
      this.error('Not sufficient Cashout Amount', { exit: ExitCodes.InvalidInput })
    }

    // Prepare extrinsic arguments
    const pullPayment = createType<PullPayment, 'PullPayment'>('PullPayment', {
      channel_id: channelId,
      cumulative_reward_earned: payoutRecord.cumulativeRewardEarned,
      // TODO: double-check which hash function to use: blake2AsU8a vs blake2AsHex
      reason: blake2AsHex(payoutRecord.payoutRationale),
    })

    const merkleProof = ([] as unknown) as Vec<ProofElement>
    payoutRecord.merkleBranch.forEach((m) => {
      const side =
        m.side === ChannelPayoutsMetadata.Body.ChannelPayout.Side.Left
          ? createType<Side, 'Side'>('Side', { Left: null })
          : createType<Side, 'Side'>('Side', { Right: null })
      const proofElement = createType<ProofElement, 'ProofElement'>('ProofElement', { hash: m.hash, side })
      merkleProof.push(proofElement)
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
