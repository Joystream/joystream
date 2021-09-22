import fs from 'fs'
import AccountsCommandBase from '../../command-base/accounts'
import DefaultCommandBase, { flags } from '../../command-base/default'
import { ValidationService } from '../../services/validation/ValidationService'
import { DistributionBucketFamilyMetadata, IDistributionBucketFamilyMetadata } from '@joystream/metadata-protobuf'

export default class LeaderSetBucketFamilyMetadata extends AccountsCommandBase {
  static description = `Set/update distribution bucket family metadata.
  Requires distribution working group leader permissions.`

  static flags = {
    familyId: flags.integer({
      char: 'f',
      description: 'Distribution bucket family id',
      required: true,
    }),
    input: flags.string({
      char: 'i',
      description: 'Path to JSON metadata file',
      required: true,
    }),
    ...DefaultCommandBase.flags,
  }

  async run(): Promise<void> {
    const { familyId, input } = this.parse(LeaderSetBucketFamilyMetadata).flags
    const leadKey = await this.getDistributorLeadKey()

    const validation = new ValidationService()
    const metadata: IDistributionBucketFamilyMetadata = validation.validate(
      'FamilyMetadata',
      JSON.parse(fs.readFileSync(input).toString())
    )

    this.log(`Setting bucket family metadata (family: ${familyId})`, metadata)
    await this.sendAndFollowTx(
      await this.getDecodedPair(leadKey),
      this.api.tx.storage.setDistributionBucketFamilyMetadata(
        familyId,
        '0x' + Buffer.from(DistributionBucketFamilyMetadata.encode(metadata).finish()).toString('hex')
      )
    )
    this.log('Bucket family metadata succesfully set/updated!')
  }
}
