import AccountsCommandBase from '../../command-base/accounts'
import DefaultCommandBase, { flags } from '../../command-base/default'

export default class OperatorAcceptInvitation extends AccountsCommandBase {
  static description = `Accept pending distribution bucket operator invitation.
  Requires the invited distribution group worker role key.`

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
    const { bucketId, workerId } = this.parse(OperatorAcceptInvitation).flags
    const workerKey = await this.getDistributorWorkerRoleKey(workerId)

    this.log(`Accepting distribution bucket operator invitation...`, {
      bucketId: bucketId.toHuman(),
      workerId,
    })
    await this.sendAndFollowTx(
      await this.getDecodedPair(workerKey),
      this.api.tx.storage.acceptDistributionBucketInvitation(workerId, bucketId)
    )
    this.log('Invitation succesfully accepted!')
  }
}
