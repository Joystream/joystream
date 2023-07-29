import { flags } from '@oclif/command'
import { setStorageOperatorMetadata } from '../../services/runtime/extrinsics'
import ApiCommandBase from '../../command-base/ApiCommandBase'
import logger from '../../services/logger'
import { ValidationService } from '../../services/metadata/validationService'
import { StorageBucketOperatorMetadata, IStorageBucketOperatorMetadata } from '@joystream/metadata-protobuf'
import fs from 'fs'
import { getWorkerRoleAccount } from '../../services/runtime/queries'

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
    workerId: flags.integer({
      char: 'w',
      required: true,
      description: 'Storage operator worker ID',
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
    const { workerId, bucketId, jsonFile, endpoint } = flags

    const validation = new ValidationService()
    const metadata: IStorageBucketOperatorMetadata = jsonFile
      ? validation.validate('OperatorMetadata', JSON.parse(fs.readFileSync(jsonFile).toString()))
      : { endpoint }

    const encodedMetadata = '0x' + Buffer.from(StorageBucketOperatorMetadata.encode(metadata).finish()).toString('hex')

    logger.info('Setting the storage operator metadata...')
    if (flags.dev) {
      await this.ensureDevelopmentChain()
    }

    const api = await this.getApi()
    const account = await getWorkerRoleAccount(api, workerId)
    if (account) {
      if (this.hasKeyringPair(account)) {
        const keypair = this.getKeyringPair(account)
        const success = await setStorageOperatorMetadata(api, keypair, workerId, bucketId, encodedMetadata)
        this.exitAfterRuntimeCall(success)
      } else {
        this.error(`Keyring does not contain role key ${account} for operator ${workerId}`)
      }
    } else {
      this.error(`workerId ${workerId} is not valid`)
    }
  }
}
