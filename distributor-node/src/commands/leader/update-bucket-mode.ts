import AccountsCommandBase from '../../command-base/accounts'
import DefaultCommandBase, { flags } from '../../command-base/default'

export default class LeaderUpdateBucketMode extends AccountsCommandBase {
  static description = `Update distribution bucket mode ("distributing" flag). Requires distribution working group leader permissions.`

  static flags = {
    bucketId: flags.bucketId({
      required: true,
    }),
    mode: flags.enum<'on' | 'off'>({
      char: 'd',
      description: 'Whether the bucket should be "on" (distributing) or "off" (not distributing)',
      required: true,
      options: ['on', 'off'],
    }),
    ...DefaultCommandBase.flags,
  }

  async run(): Promise<void> {
    const { bucketId, mode } = this.parse(LeaderUpdateBucketMode).flags
    const leadKey = await this.getDistributorLeadKey()

    this.log(`Updating distribution bucket mode...`, { bucketId: bucketId.toHuman(), mode })
    await this.sendAndFollowTx(
      await this.getDecodedPair(leadKey),
      this.api.tx.storage.updateDistributionBucketMode(bucketId, mode === 'on')
    )
    this.log('Bucket mode succesfully updated!')
  }
}
