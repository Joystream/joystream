import { flags } from '@oclif/command'
import AccountsCommandBase from '../../command-base/accounts'
import DefaultCommandBase from '../../command-base/default'

export default class LeaderSetBucketsPerBagLimit extends AccountsCommandBase {
  static description = `Set max. distribution buckets per bag limit. Requires distribution working group leader permissions.`

  static flags = {
    limit: flags.integer({
      char: 'l',
      description: 'New limit value',
      required: true,
    }),
    ...DefaultCommandBase.flags,
  }

  async run(): Promise<void> {
    const { limit } = this.parse(LeaderSetBucketsPerBagLimit).flags
    const leadKey = await this.getDistributorLeadKey()

    this.log(`Setting new buckets per bag limit (${limit})...`)
    await this.sendAndFollowTx(
      await this.getDecodedPair(leadKey),
      this.api.tx.storage.updateDistributionBucketsPerBagLimit(limit)
    )
    this.log('Limit succesfully updated!')
  }
}
