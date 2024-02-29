import {
  DistributionBucketOperatorMetadata,
  IDistributionBucketOperatorMetadata,
  INodeOperationalStatusMetadata,
  NodeOperationalStatusMetadata,
} from '@joystream/metadata-protobuf'
import fs from 'fs'
import AccountsCommandBase from '../../command-base/accounts'
import DefaultCommandBase, { flags } from '../../command-base/default'
import { ValidationService } from '../../services/validation/ValidationService'
import { NODE_OPERATIONAL_STATUS_OPTIONS, NodeOperationalStatus } from '../../types/metadata'

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
    operationalStatus: flags.enum<NodeOperationalStatus>({
      char: 'o',
      options: [...NODE_OPERATIONAL_STATUS_OPTIONS],
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

    let operationalStatus: INodeOperationalStatusMetadata = {}
    switch (statusType) {
      case 'Normal': {
        operationalStatus = { status: NodeOperationalStatusMetadata.OperationalStatus.NORMAL }
        break
      }
      case 'NoService': {
        operationalStatus = { status: NodeOperationalStatusMetadata.OperationalStatus.NO_SERVICE }
        break
      }
      case 'NoServiceFrom': {
        operationalStatus = {
          status: NodeOperationalStatusMetadata.OperationalStatus.NO_SERVICE,
          noServiceFrom: (await this.datePrompt({ message: 'Enter No Service period start date' })).toISOString(),
        }
        break
      }
      case 'NoServiceDuring': {
        operationalStatus = {
          status: NodeOperationalStatusMetadata.OperationalStatus.NO_SERVICE,
          noServiceFrom: (await this.datePrompt({ message: 'Enter No Service period start date' })).toISOString(),
          noServiceTo: (await this.datePrompt({ message: 'Enter No Service period end date' })).toISOString(),
        }
      }
    }

    const validation = new ValidationService()
    let metadata: IDistributionBucketOperatorMetadata
    if (input) {
      const params = validation.validate('OperatorMetadata', JSON.parse(fs.readFileSync(input).toString()))
      metadata = {
        ...params,
        operationalStatus: params.operationalStatus
          ? {
              ...params.operationalStatus,
              status:
                params.operationalStatus?.status === 'Normal'
                  ? NodeOperationalStatusMetadata.OperationalStatus.NORMAL
                  : NodeOperationalStatusMetadata.OperationalStatus.NO_SERVICE,
            }
          : {},
      }
    } else {
      metadata = { endpoint, operationalStatus }
    }

    this.log(`Setting bucket operator metadata...`, {
      bucketId: bucketId.toHuman(),
      workerId,
      metadata,
      operationalStatus,
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
