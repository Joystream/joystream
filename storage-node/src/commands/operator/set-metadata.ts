import {
  INodeOperationalStatusMetadata,
  IStorageBucketOperatorMetadata,
  NodeOperationalStatusMetadata,
  StorageBucketOperatorMetadata,
} from '@joystream/metadata-protobuf'
import { flags } from '@oclif/command'
import fs from 'fs'
import ApiCommandBase from '../../command-base/ApiCommandBase'
import logger from '../../services/logger'
import { NODE_OPERATIONAL_STATUS_OPTIONS, NodeOperationalStatus } from '../../services/metadata/schemas'
import { ValidationService } from '../../services/metadata/validationService'
import { setStorageOperatorMetadata } from '../../services/runtime/extrinsics'
/**
 * CLI command:
 * Sets metadata for the storage bucket.
 *
 * @remarks
 * Storage provider (operator) command. Requires an additional worker ID for
 * runtime verification.
 * Shell command: "operator:set-metadata"
 */
export default class OperatorSetMetadata extends ApiCommandBase {
  static description = 'Set metadata for the storage bucket.'

  static flags = {
    bucketId: flags.integer({
      char: 'i',
      required: true,
      description: 'Storage bucket ID',
    }),
    operatorId: flags.integer({
      char: 'w',
      required: true,
      description: 'Storage bucket operator ID (storage group worker ID)',
    }),
    endpoint: flags.string({
      char: 'e',
      description: 'Root distribution node endpoint',
      exclusive: ['jsonFile'],
    }),
    operationalStatus: flags.enum<NodeOperationalStatus>({
      char: 'o',
      options: [...NODE_OPERATIONAL_STATUS_OPTIONS],
      required: false,
      description: 'Operational status of the operator',
    }),
    jsonFile: flags.string({
      char: 'j',
      description: 'Path to JSON metadata file',
      exclusive: ['endpoint'],
    }),
    ...ApiCommandBase.flags,
  }

  async run(): Promise<void> {
    const { flags } = this.parse(OperatorSetMetadata)
    const { operatorId, bucketId, jsonFile, endpoint, operationalStatus: statusType } = flags

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
    let metadata: IStorageBucketOperatorMetadata
    if (jsonFile) {
      const input = validation.validate('OperatorMetadata', JSON.parse(fs.readFileSync(jsonFile).toString()))
      metadata = {
        ...input,
        operationalStatus: {
          ...input.operationalStatus,
          status:
            input.operationalStatus?.status === 'Normal'
              ? NodeOperationalStatusMetadata.OperationalStatus.NORMAL
              : NodeOperationalStatusMetadata.OperationalStatus.NO_SERVICE,
        },
      }
    } else {
      metadata = { endpoint, operationalStatus }
    }

    const encodedMetadata = '0x' + Buffer.from(StorageBucketOperatorMetadata.encode(metadata).finish()).toString('hex')

    logger.info('Se tting the storage node operational status...')
    if (flags.dev) {
      await this.ensureDevelopmentChain()
    }

    const account = this.getAccount(flags)

    const api = await this.getApi()
    const success = await setStorageOperatorMetadata(api, account, operatorId, bucketId, encodedMetadata)

    this.exitAfterRuntimeCall(success)
  }
}
