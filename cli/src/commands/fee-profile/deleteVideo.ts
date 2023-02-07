import FeeProfileCommandBase from '../../base/FeeProfileCommandBase'
import { flags } from '@oclif/command'
import { createType } from '@joystream/types'
import chalk from 'chalk'
import { formatBalance } from '@polkadot/util'

const DEFAULT_ASSETS_NUM = 2

export default class FeeProfileDeleteVideo extends FeeProfileCommandBase {
  static description = 'Create fee profile of forum.delete_video extrinsic.'

  static flags = {
    assetsNum: flags.integer({
      char: 'a',
      default: DEFAULT_ASSETS_NUM,
      description: 'Number of assets to use for estimating the costs/returns',
    }),
    storageBucketsNum: flags.integer({
      char: 'S',
      description:
        'Number of storage buckets to use for estimating tx fee.\n' +
        "By default this number will be based on the current chain's dynamic bag policy for channel bags",
    }),
    ...super.flags,
  }

  async run(): Promise<void> {
    const api = this.getOriginalApi()
    const { assetsNum, storageBucketsNum: forcedStorageBucketsNum } = this.parse(FeeProfileDeleteVideo).flags
    const dataObjectBloatBond = await this.getApi().dataObjectStateBloatBond()
    const videoBloatBond = await this.getApi().videoStateBloatBond()

    const channelBagPolicy = await api.query.storage.dynamicBagCreationPolicies('Channel')
    const storageBucketsNum = forcedStorageBucketsNum || channelBagPolicy.numberOfStorageBuckets.toNumber()

    this.log(`Data object bloat bond: ${chalk.cyanBright(formatBalance(dataObjectBloatBond))}`)
    this.log(`Video bloat bond: ${chalk.cyanBright(formatBalance(videoBloatBond))}`)
    this.log('Parameters:')
    this.jsonPrettyPrint(
      JSON.stringify({
        storageBucketsNum,
        assetsNum,
      })
    )

    const tx = api.tx.content.deleteVideo({ Member: 0 }, 0, assetsNum, createType('Option<u32>', storageBucketsNum))
    const returns = {
      dataObjectsBloatBond: dataObjectBloatBond.muln(assetsNum),
      videoBloatBond,
    }
    await this.profile(tx, undefined, returns)
  }
}
