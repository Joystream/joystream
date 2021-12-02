import { flags } from '@oclif/command'
import { setStorageOperatorMetadata } from '../../services/runtime/extrinsics'
import ApiCommandBase from '../../command-base/ApiCommandBase'
import logger from '../../services/logger'
import { ValidationService } from '../../services/metadata/validationService'
import { StorageBucketOperatorMetadata, IStorageBucketOperatorMetadata } from '@joystream/metadata-protobuf'
import fs from 'fs'
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
    jsonFile: flags.string({
      char: 'j',
      description: 'Path to JSON metadata file',
      exclusive: ['endpoint'],
    }),
    ...ApiCommandBase.flags,
  }

  async run(): Promise<void> {
    const { flags } = this.parse(OperatorSetMetadata)
    const { operatorId, bucketId, jsonFile, endpoint } = flags

    const validation = new ValidationService()
    const metadata: IStorageBucketOperatorMetadata = jsonFile
      ? validation.validate('OperatorMetadata', JSON.parse(fs.readFileSync(jsonFile).toString()))
      : { endpoint }

    const encodedMetadata = '0x' + Buffer.from(StorageBucketOperatorMetadata.encode(metadata).finish()).toString('hex')

    logger.info('Setting the storage operator metadata...')
    if (flags.dev) {
      await this.ensureDevelopmentChain()
    }

    const account = this.getAccount(flags)

    const api = await this.getApi()
    const success = await setStorageOperatorMetadata(api, account, operatorId, bucketId, encodedMetadata)

    this.exitAfterRuntimeCall(success)
  }
}
