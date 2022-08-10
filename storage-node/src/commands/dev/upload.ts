import { flags } from '@oclif/command'
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
    bagId: ApiCommandBase.extraFlags.bagId({
      char: 'i',
      required: true,
      description: 'BagId for uploading the Data object.',
    }),
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

    const bagId = flags.bagId
    const objectSize = flags.size
    const objectCid = flags.cid

    logger.info('Uploading data objects...')

    const api = await this.getApi()

    const dataFee = await api.query.storage.dataObjectPerMegabyteFee()
    const stateBloatBond = await api.query.storage.dataObjectStateBloatBondValue()

    logger.info(`Current data fee: ${dataFee}; Current state bloat bond: ${stateBloatBond}`)

    await uploadDataObjects(api, bagId, objectSize, objectCid, dataFee.toNumber(), stateBloatBond.toNumber())
  }
}
