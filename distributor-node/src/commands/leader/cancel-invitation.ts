import AccountsCommandBase from '../../command-base/accounts'
import DefaultCommandBase, { flags } from '../../command-base/default'

export default class LeaderCancelInvitation extends AccountsCommandBase {
  static description = `Cancel pending distribution bucket operator invitation.
  Requires distribution working group leader permissions.`

  static flags = {
    bucketId: flags.bucketId({
      required: true,
    }),
    workerId: flags.integer({
      char: 'w',
      description: 'ID of the invited operator (distribution group worker)',
      required: true,
    }),
    ...DefaultCommandBase.flags,
  }

  async run(): Promise<void> {
    const { bucketId, workerId } = this.parse(LeaderCancelInvitation).flags
    const leadKey = await this.getDistributorLeadKey()

    this.log(`Canceling distribution bucket operator invitation...`, {
      bucketId: bucketId.toHuman(),
      workerId: workerId,
    })
    await this.sendAndFollowTx(
      await this.getDecodedPair(leadKey),
      this.api.tx.storage.cancelDistributionBucketOperatorInvite(bucketId, workerId)
    )
    this.log('Invitation succesfully canceled!')
  }
}
