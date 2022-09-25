import FeeProfileCommandBase from '../../base/FeeProfileCommandBase'
import { flags } from '@oclif/command'
import { createType } from '@joystream/types'
import chalk from 'chalk'
import { formatBalance } from '@polkadot/util'

const DEFAULT_ASSETS_NUM = 2

export default class FeeProfileDeleteChannel extends FeeProfileCommandBase {
  static description = 'Create fee profile of content.delete_channel extrinsic.'

  static flags = {
    assetsNum: flags.integer({
      char: 'a',
      default: DEFAULT_ASSETS_NUM,
      description: 'Number of assets to use for estimating the costs/returns',
    }),
    distributionBucketsNum: flags.integer({
      char: 'D',
      description:
        'Number of distribution buckets to use for estimating tx fee.\n' +
        "By default this number will be based on the current chain's dynamic bag policy for channel bags",
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
    const {
      assetsNum,
      storageBucketsNum: forcedStorageBucketsNum,
      distributionBucketsNum: forcedDistributionBucketsNum,
    } = this.parse(FeeProfileDeleteChannel).flags
    const dataObjectBloatBond = await this.getApi().dataObjectStateBloatBond()
    const channelBloatBond = await this.getApi().channelStateBloatBond()

    const channelBagPolicy = await api.query.storage.dynamicBagCreationPolicies('Channel')
    const storageBucketsNum = forcedStorageBucketsNum || channelBagPolicy.numberOfStorageBuckets.toNumber()
    const distributionBucketsNum =
      forcedDistributionBucketsNum ||
      Array.from(channelBagPolicy.families.entries()).reduce((sum, curr) => (sum += curr[1].toNumber()), 0)

    this.log(`Data object bloat bond: ${chalk.cyanBright(formatBalance(dataObjectBloatBond))}`)
    this.log(`Channel bloat bond: ${chalk.cyanBright(formatBalance(channelBloatBond))}`)
    this.log('Parameters:')
    this.jsonPrettyPrint(
      JSON.stringify({
        storageBucketsNum,
        distributionBucketsNum,
        assetsNum,
      })
    )

    const tx = api.tx.content.deleteChannel(
      { Member: 0 },
      0,
      createType('PalletContentChannelBagWitness', {
        storageBucketsNum,
        distributionBucketsNum,
      }),
      assetsNum
    )
    const txFee = await this.getApi().estimateFee(this.pairs.alice, tx)
    const costs = {
      txFee,
    }
    const returns = {
      dataObjectsBloatBond: dataObjectBloatBond.muln(assetsNum),
      channelBloatBond,
    }
    this.profile(costs, returns)
  }
}
