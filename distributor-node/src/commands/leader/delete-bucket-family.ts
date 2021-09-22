import { flags } from '@oclif/command'
import AccountsCommandBase from '../../command-base/accounts'
import DefaultCommandBase from '../../command-base/default'

export default class LeaderDeleteBucketFamily extends AccountsCommandBase {
  static description = `Delete distribution bucket family. Requires distribution working group leader permissions.`

  static flags = {
    familyId: flags.integer({
      char: 'f',
      description: 'Distribution bucket family id',
      required: true,
    }),
    ...DefaultCommandBase.flags,
  }

  async run(): Promise<void> {
    const { familyId } = this.parse(LeaderDeleteBucketFamily).flags
    const leadKey = await this.getDistributorLeadKey()

    this.log(`Deleting distribution bucket family (${familyId})...`)
    await this.sendAndFollowTx(
      await this.getDecodedPair(leadKey),
      this.api.tx.storage.deleteDistributionBucketFamily(familyId)
    )
    this.log('Bucket family succesfully deleted!')
  }
}
