import FeeProfileCommandBase from '../../base/FeeProfileCommandBase'
import { flags } from '@oclif/command'
import _ from 'lodash'
import { ChannelMetadata, IChannelMetadata } from '@joystream/metadata-protobuf'
import { metadataToBytes } from '../../helpers/serialization'
import { createType } from '@joystream/types'
import {
  PalletContentIterableEnumsChannelActionPermission,
  PalletContentStorageAssetsRecord,
} from '@polkadot/types/lookup'
import BN from 'bn.js'
import chalk from 'chalk'
import { formatBalance } from '@polkadot/util'

const DEFAULT_COLLABORATORS_NUM = 0
const DEFAULT_AVATAR_SIZE_MB = 1
const DEFAULT_COVER_PHOTO_SIZE_MB = 1
const DEFAULT_TITLE_LENGTH = 15
const DEFAULT_DESCRIPTION_LENGTH = 200

export default class FeeProfileCreateChannel extends FeeProfileCommandBase {
  static description = 'Create fee profile of content.create_channel extrinsic.'

  static flags = {
    titleLen: flags.integer({
      char: 't',
      default: DEFAULT_TITLE_LENGTH,
      description: 'Channel title (part of channel metadata) length to use for estimating tx fee',
    }),
    descriptionLen: flags.integer({
      char: 'd',
      default: DEFAULT_DESCRIPTION_LENGTH,
      description: 'Channel description (part of channel metadata) length to use for estimating tx fee',
    }),
    collaboratorsNum: flags.integer({
      char: 'C',
      default: DEFAULT_COLLABORATORS_NUM,
      description: 'Number of channel collaborators to use for estimating tx fee',
    }),
    noAvatar: flags.boolean({
      description: 'If provided - channel with no avatar will be used for estimating the costs',
      exclusive: ['avatarSize'],
    }),
    noCover: flags.boolean({
      description: 'If provided - channel with no cover photo will be used for estimating the costs',
      exclusive: ['coverSize'],
    }),
    avatarSize: flags.integer({
      char: 'a',
      default: DEFAULT_AVATAR_SIZE_MB,
      description: 'Avatar size in MB to use when estimating the costs',
    }),
    coverSize: flags.integer({
      char: 'c',
      default: DEFAULT_COVER_PHOTO_SIZE_MB,
      description: 'Cover photo size in MB to use when estimating the costs',
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

  getAssets(expectedDataSizeFee: BN): PalletContentStorageAssetsRecord | null {
    const { noAvatar, noCover, avatarSize, coverSize } = this.parse(FeeProfileCreateChannel).flags
    if (noAvatar && noCover) {
      return null
    }
    const mockAvatar = this.mockAsset(avatarSize)
    const mockCover = this.mockAsset(coverSize)
    const objectCreationList = [mockAvatar, mockCover]
    if (noAvatar) {
      objectCreationList.shift()
    }
    if (noCover) {
      objectCreationList.pop()
    }
    return createType('PalletContentStorageAssetsRecord', {
      expectedDataSizeFee,
      objectCreationList,
    })
  }

  async run(): Promise<void> {
    const api = this.getOriginalApi()
    const {
      collaboratorsNum,
      storageBucketsNum: forcedStorageBucketsNum,
      distributionBucketsNum: forcedDistributionBucketsNum,
      avatarSize: inputAvatarSize,
      coverSize: inputCoverSize,
      noAvatar,
      noCover,
      titleLen,
      descriptionLen,
    } = this.parse(FeeProfileCreateChannel).flags
    const dataSizeFee = await this.getApi().dataObjectPerMegabyteFee()
    const dataObjectBloatBond = await this.getApi().dataObjectStateBloatBond()
    const channelBloatBond = await this.getApi().channelStateBloatBond()

    const channelBagPolicy = await api.query.storage.dynamicBagCreationPolicies('Channel')
    const storageBucketsNum = forcedStorageBucketsNum || channelBagPolicy.numberOfStorageBuckets.toNumber()
    const distributionBucketsNum =
      forcedDistributionBucketsNum ||
      Array.from(channelBagPolicy.families.entries()).reduce((sum, curr) => (sum += curr[1].toNumber()), 0)
    const avatarSize = noAvatar ? 0 : inputAvatarSize
    const coverSize = noCover ? 0 : inputCoverSize
    const assets = this.getAssets(dataSizeFee)
    const assetsNum = assets?.objectCreationList.length || 0
    const assetsSizeMB = avatarSize + coverSize

    this.log(`Data fee per MB: ${chalk.cyanBright(formatBalance(dataSizeFee))}`)
    this.log(`Data object bloat bond: ${chalk.cyanBright(formatBalance(dataObjectBloatBond))}`)
    this.log(`Channel bloat bond: ${chalk.cyanBright(formatBalance(channelBloatBond))}`)
    this.log('Parameters:')
    this.jsonPrettyPrint(
      JSON.stringify({
        collaboratorsNum,
        storageBucketsNum,
        distributionBucketsNum,
        titleLen,
        descriptionLen,
        assetsNum,
        assetsSizeMB,
      })
    )

    const mockMetadata: IChannelMetadata = {
      avatarPhoto: noAvatar ? undefined : 0,
      coverPhoto: noCover ? undefined : 0,
      language: 'en',
      title: _.repeat('x', titleLen),
      description: _.repeat('x', descriptionLen),
    }

    const tx = api.tx.content.createChannel(
      { Member: 0 },
      createType('PalletContentChannelCreationParametersRecord', {
        expectedChannelStateBloatBond: channelBloatBond,
        expectedDataObjectStateBloatBond: dataObjectBloatBond,
        collaborators: new Map(
          Array.from({ length: collaboratorsNum }, (v, k) => [
            k,
            [] as PalletContentIterableEnumsChannelActionPermission[],
          ])
        ),
        assets,
        storageBuckets: Array.from({ length: storageBucketsNum }, (v, k) => k),
        distributionBuckets: Array.from({ length: distributionBucketsNum }, (v, k) => ({
          distributionBucketFamilyId: k,
          distributionBucketIndex: k,
        })),
        meta: metadataToBytes(ChannelMetadata, mockMetadata),
      })
    )
    const txFee = await this.getApi().estimateFee(this.pairs.alice, tx)
    const costs = {
      dataObjectsBloatBond: dataObjectBloatBond.muln(assetsNum),
      dataObjectsSizeFee: dataSizeFee.muln(assetsSizeMB),
      channelBloatBond,
      txFee,
    }
    this.profile(costs)
  }
}
