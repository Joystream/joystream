import { flags } from '@oclif/command'
import { updateStorageBucketsForBag } from '../../services/runtime/extrinsics'
import ApiCommandBase from '../../command-base/ApiCommandBase'
import { parseBagId } from '../../services/helpers/bagTypes'
import logger from '../../services/logger'
import ExitCodes from '../../command-base/ExitCodes'
import _ from 'lodash'

// Custom 'integer array' oclif flag.
const integerArrFlags = {
  integerArr: flags.build({
    parse: (value: string) => {
      const arr: number[] = value.split(',').map((v) => {
        if (!/^-?\d+$/.test(v)) {
          throw new Error(`Expected comma-separated integers, but received: ${value}`)
        }
        return parseInt(v)
      })
      return arr
    },
  }),
}

/**
 * CLI command:
 * Updates bags-to-buckets relationships.
 *
 * @remarks
 * Storage working group leader command. Requires storage WG leader priviliges.
 * Shell command: "leader:update-bag"
 */
export default class LeaderUpdateBag extends ApiCommandBase {
  static description = 'Add/remove a storage bucket from a bag (adds by default).'

  static flags = {
    add: integerArrFlags.integerArr({
      char: 'a',
      description: 'ID of a bucket to add to bag',
      default: [],
    }),
    remove: integerArrFlags.integerArr({
      char: 'r',
      description: 'ID of a bucket to remove from bag',
      default: [],
    }),
    bagId: flags.string({
      char: 'i',
      required: true,
      description: `
      Bag ID. Format: {bag_type}:{sub_type}:{id}.
      - Bag types: 'static', 'dynamic'
      - Sub types: 'static:council', 'static:wg', 'dynamic:member', 'dynamic:channel'
      - Id: 
        - absent for 'static:council'
        - working group name for 'static:wg'
        - integer for 'dynamic:member' and 'dynamic:channel'
      Examples:
      - static:council
      - static:wg:storage
      - dynamic:member:4
      `,
    }),
    ...ApiCommandBase.flags,
  }

  async run(): Promise<void> {
    const { flags } = this.parse(LeaderUpdateBag)

    logger.info('Updating the bag...')
    if (flags.dev) {
      await this.ensureDevelopmentChain()
    }

    if (_.isEmpty(flags.add) && _.isEmpty(flags.remove)) {
      logger.error('No bucket ID provided.')
      this.exit(ExitCodes.InvalidParameters)
    }

    const account = this.getAccount(flags)
    const api = await this.getApi()
    const bagId = parseBagId(api, flags.bagId)

    const success = await updateStorageBucketsForBag(api, bagId, account, flags.add, flags.remove)

    this.exitAfterRuntimeCall(success)
  }
}
