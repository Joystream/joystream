import { flags } from '@oclif/command'
import BN from 'bn.js'
import { uploadDataObjects } from '../../services/runtime/extrinsics'
import ApiCommandBase from '../../command-base/ApiCommandBase'
import logger from '../../services/logger'

/**
 * CLI command:
 * Registers the data object (content ID and its size) in the runtime.
 *
 * @remarks
 * Should be run only during the development.
 * Shell command: "dev:upload"
 */
export default class DevUpload extends ApiCommandBase {
  static description = 'Upload data object (development mode only).'

  static flags = {
    size: flags.integer({
      char: 's',
      required: true,
      description: 'Data object size.',
    }),
    cid: flags.string({
      char: 'c',
      required: true,
      description: 'Data object IPFS content ID.',
    }),
    ...ApiCommandBase.flags,
  }

  async run(): Promise<void> {
    const { flags } = this.parse(DevUpload)

    await this.ensureDevelopmentChain()

    const objectSize = flags.size ?? 0
    const objectCid = flags.cid

    logger.info('Uploading data objects...')

    const api = await this.getApi()

    // Must be number.
    const dataFee =
      (await api.query.storage.dataObjectPerMegabyteFee()) as unknown as BN

    logger.info(`Current data fee: ${dataFee}`)

    await uploadDataObjects(api, objectSize, objectCid, dataFee.toNumber())
  }
}
