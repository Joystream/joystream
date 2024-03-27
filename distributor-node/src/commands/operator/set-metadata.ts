import {
  DistributionBucketOperatorMetadata,
  IDistributionBucketOperatorMetadata,
  INodeOperationalStatus,
  NodeOperationalStatus,
} from '@joystream/metadata-protobuf'
import fs from 'fs'
import AccountsCommandBase from '../../command-base/accounts'
import DefaultCommandBase, { flags } from '../../command-base/default'
import { ValidationService } from '../../services/validation/ValidationService'

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
    operationalStatus: flags.enum<Exclude<NodeOperationalStatus['nodeOperationalStatus'], undefined>>({
      char: 'o',
      options: ['normal', 'noService', 'noServiceFrom', 'noServiceUntil'],
      required: false,
      description: 'Operational status of the operator',
    }),
    input: flags.string({
      char: 'i',
      description: 'Path to JSON metadata file',
      exclusive: ['endpoint'],
    }),
    ...DefaultCommandBase.flags,
  }

  async run(): Promise<void> {
    const { bucketId, workerId, input, endpoint, operationalStatus: statusType } = this.parse(OperatorSetMetadata).flags
    const workerKey = await this.getDistributorWorkerRoleKey(workerId)

    let operationalStatus: INodeOperationalStatus
    switch (statusType) {
      case 'normal': {
        operationalStatus = { normal: {} }
        break
      }
      case 'noService': {
        operationalStatus = { noService: {} }
        break
      }
      case 'noServiceFrom': {
        operationalStatus = {
          noServiceFrom: {
            from: (await this.datePrompt({ message: 'Enter No Service period start date' })).toISOString(),
          },
        }
        break
      }
      case 'noServiceUntil': {
        operationalStatus = {
          noServiceUntil: {
            from: (await this.datePrompt({ message: 'Enter No Service period start date' })).toISOString(),
            until: (await this.datePrompt({ message: 'Enter No Service period end date' })).toISOString(),
          },
        }
      }
    }

    const validation = new ValidationService()
    let metadata: IDistributionBucketOperatorMetadata
    if (input) {
      const params = validation.validate('OperatorMetadata', JSON.parse(fs.readFileSync(input).toString()))
      metadata = {
        ...params,
        ...(params.operationalStatus && { operationalStatus: params.operationalStatus }),
      }
    } else {
      metadata = { endpoint, operationalStatus }
    }

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
    this.log('Bucket operator metadata successfully set/updated!')
  }
}
