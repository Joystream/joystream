import AccountsCommandBase from '../../command-base/accounts'
import DefaultCommandBase, { flags } from '../../command-base/default'

export default class LeaderUpdateBucketMode extends AccountsCommandBase {
  static description = `Update distribution bucket mode ("distributing" flag). Requires distribution working group leader permissions.`

  static flags = {
    bucketId: flags.integer({
      char: 'B',
      description: 'Distribution bucket id',
      required: true,
    }),
    familyId: flags.integer({
      char: 'f',
      description: 'Distribution bucket family id',
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
    const { bucketId, familyId, mode } = this.parse(LeaderUpdateBucketMode).flags
    const leadKey = await this.getDistributorLeadKey()

    this.log(`Updating distribution bucket mode (${bucketId}, distributing: ${mode})...`)
    await this.sendAndFollowTx(
      await this.getDecodedPair(leadKey),
      this.api.tx.storage.updateDistributionBucketMode(familyId, bucketId, mode === 'on')
    )
    this.log('Bucket mode succesfully updated!')
  }
}
