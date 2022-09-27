import { ChannelPayoutsMetadata } from '@joystream/metadata-protobuf'
import { createType } from '@joystream/types'
import { PalletCommonProofElementRecord as ProofElement } from '@polkadot/types/lookup'
import { channelPayoutRecord, generateCommitmentFromPayoutRecord } from '@joystreamjs/content'
import { Vec } from '@polkadot/types'
import { blake2AsHex } from '@polkadot/util-crypto'
import chalk from 'chalk'
import ExitCodes from '../../ExitCodes'
import UploadCommandBase from '../../base/UploadCommandBase'
import { BN } from 'bn.js'

export default class ClaimChannelPayoutReward extends UploadCommandBase {
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

    const storageNodeInfo = await this.getRandomActiveStorageNodeInfo('static:council')
    if (!storageNodeInfo) {
      this.error('No active storage node found')
    }

    const commitment = await this.getOriginalApi().query.content.commitment()
    const [{ payloadDataObject }] = await this.getQNApi().getChannelPayoutsUpdatedEventByCommitment(
      commitment.toString()
    )
    const payoutRecord = await channelPayoutRecord(
      channelId,
      `${storageNodeInfo.apiEndpoint}/files`,
      new BN(payloadDataObject.id)
    )
    const maxCashoutAllowed = (await this.getOriginalApi().query.content.maxCashoutAllowed()).toNumber()
    const minCashoutAllowed = (await this.getOriginalApi().query.content.minCashoutAllowed()).toNumber()

    if (payoutRecord.cumulativeRewardEarned > maxCashoutAllowed) {
      this.error('Cumulative payout earned by channel exceeds the max cashout allowed', {
        exit: ExitCodes.InvalidInput,
      })
    }
    if (payoutRecord.cumulativeRewardEarned < minCashoutAllowed) {
      this.error('Not sufficient Cashout Amount', { exit: ExitCodes.InvalidInput })
    }

    if (generateCommitmentFromPayoutRecord(payoutRecord) !== commitment.toString()) {
      this.error('Not sufficient Cashout Amount', { exit: ExitCodes.InvalidInput })
    }

    // Prepare extrinsic arguments
    const pullPayment = createType('PalletContentPullPaymentElement', {
      channelId,
      cumulativeRewardEarned: payoutRecord.cumulativeRewardEarned,
      // TODO: double-check which hash function to use: blake2AsU8a vs blake2AsHex
      reason: blake2AsHex(payoutRecord.payoutRationale),
    })

    const merkleProof = [] as unknown as Vec<ProofElement>
    payoutRecord.merkleBranch.forEach((m) => {
      const proofElement = createType('PalletCommonProofElementRecord', {
        hash_: m.hash,
        side: ChannelPayoutsMetadata.Body.ChannelPayoutRecord.Side.Right ? { Right: null } : { Left: null },
      })
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
