import fs from 'fs'
import AccountsCommandBase from '../../command-base/accounts'
import DefaultCommandBase, { flags } from '../../command-base/default'
import { ValidationService } from '../../services/validation/ValidationService'
import { DistributionBucketOperatorMetadata, IDistributionBucketOperatorMetadata } from '@joystream/metadata-protobuf'

export default class OperatorSetMetadata extends AccountsCommandBase {
  static description = `Set/update distribution bucket operator metadata.
  Requires active distribution bucket operator worker role key.`

  static flags = {
    bucketId: flags.bucketId({
      required: true,
    }),
    workerId: flags.integer({
      char: 'w',
      description: 'ID of the operator (distribution group worker)',
      required: true,
    }),
    endpoint: flags.string({
      char: 'e',
      description: 'Root distribution node endpoint',
      exclusive: ['input'],
    }),
    input: flags.string({
      char: 'i',
      description: 'Path to JSON metadata file',
      exclusive: ['endpoint'],
    }),
    ...DefaultCommandBase.flags,
  }

  async run(): Promise<void> {
    const { bucketId, workerId, input, endpoint } = this.parse(OperatorSetMetadata).flags
    const workerKey = await this.getDistributorWorkerRoleKey(workerId)

    const validation = new ValidationService()
    const metadata: IDistributionBucketOperatorMetadata = input
      ? validation.validate('OperatorMetadata', JSON.parse(fs.readFileSync(input).toString()))
      : { endpoint }

    this.log(`Setting bucket operator metadata...`, {
      bucketId: bucketId.toHuman(),
      workerId,
      metadata,
    })
    await this.sendAndFollowTx(
      await this.getDecodedPair(workerKey),
      this.api.tx.storage.setDistributionOperatorMetadata(
        workerId,
        bucketId,
        '0x' + Buffer.from(DistributionBucketOperatorMetadata.encode(metadata).finish()).toString('hex')
      )
    )
    this.log('Bucket operator metadata succesfully set/updated!')
  }
}
