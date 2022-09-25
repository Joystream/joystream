import FeeProfileCommandBase from '../../base/FeeProfileCommandBase'
import { flags } from '@oclif/command'
import _ from 'lodash'
import { VideoMetadata, IVideoMetadata } from '@joystream/metadata-protobuf'
import { metadataToBytes } from '../../helpers/serialization'
import { createType } from '@joystream/types'
import { PalletContentStorageAssetsRecord } from '@polkadot/types/lookup'
import BN from 'bn.js'
import chalk from 'chalk'
import { formatBalance } from '@polkadot/util'

const DEFAULT_MEDIA_SIZE_MB = 200
const DEFAULT_THUMBNAIL_SIZE_MB = 1
const DEFAULT_TITLE_LENGTH = 15
const DEFAULT_DESCRIPTION_LENGTH = 200
const DEFAULT_VIDEO_CATEGORY_LENGTH = 10
const DEFAULT_SUBTITLES_NUM = 1
const DEFAULT_SUBTITLES_FILE_SIZE_MB = 1

export default class FeeProfileCreateVideo extends FeeProfileCommandBase {
  static description = 'Create fee profile of content.create_video extrinsic.'

  static flags = {
    titleLen: flags.integer({
      char: 't',
      default: DEFAULT_TITLE_LENGTH,
      description: 'Video title (part of video metadata) length to use for estimating tx fee',
    }),
    descriptionLen: flags.integer({
      char: 'd',
      default: DEFAULT_DESCRIPTION_LENGTH,
      description: 'Video description (part of video metadata) length to use for estimating tx fee',
    }),
    categoryLen: flags.integer({
      char: 'c',
      default: DEFAULT_VIDEO_CATEGORY_LENGTH,
      description: 'Video cateogry (part of video metadata) length to use for estimating tx fee',
    }),
    subtitlesNum: flags.integer({
      char: 's',
      default: DEFAULT_SUBTITLES_NUM,
      description: 'Number of subtitles (subtitle assets) to use for estimating the costs',
    }),
    noMedia: flags.boolean({
      description: 'If provided - video with no media asset will be used for estimating the costs',
      exclusive: ['mediaSize'],
    }),
    withNft: flags.boolean({
      description: 'If provided - `auto_issue_nft` parameter will be set when estimating tx fee',
    }),
    nftAuctionWhitelistSize: flags.integer({
      char: 'w',
      description:
        "If `--withNft` is provided - determines auction whitelist size in nft's InitTransactionalStatus to use when estimating tx fee (Default: 0)",
      dependsOn: ['withNft'],
    }),
    noThumbnail: flags.boolean({
      description: 'If provided - video with no thumbnail asset will be used for estimating the costs',
      exclusive: ['thumbnailSize'],
    }),
    mediaSize: flags.integer({
      required: false,
      char: 'm',
      default: DEFAULT_MEDIA_SIZE_MB,
      description: 'Video media file size in MB to use for estimating the costs',
    }),
    thumbnailSize: flags.integer({
      char: 'T',
      default: DEFAULT_THUMBNAIL_SIZE_MB,
      description: 'Thumbnail photo size in MB to use for estimating the costs',
    }),
    subtitlesFileSize: flags.integer({
      char: 'f',
      default: DEFAULT_SUBTITLES_FILE_SIZE_MB,
      description: 'Single subtitles file/asset size in MB to use for estimating the costs',
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
    const { noThumbnail, noMedia, thumbnailSize, mediaSize, subtitlesNum, subtitlesFileSize } =
      this.parse(FeeProfileCreateVideo).flags
    if (noThumbnail && noMedia && subtitlesNum === 0) {
      return null
    }
    const mockThumbnail = this.mockAsset(thumbnailSize)
    const mockMedia = this.mockAsset(mediaSize)
    const mockSubtitles = Array.from({ length: subtitlesNum }, () => this.mockAsset(subtitlesFileSize))
    const objectCreationList = [mockThumbnail, ...mockSubtitles, mockMedia]
    if (noThumbnail) {
      objectCreationList.shift()
    }
    if (noMedia) {
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
      storageBucketsNum: forcedStorageBucketsNum,
      thumbnailSize: inputThumbnailSize,
      mediaSize: inputMediaSize,
      noThumbnail,
      noMedia,
      titleLen,
      descriptionLen,
      categoryLen,
      subtitlesNum,
      subtitlesFileSize,
      withNft = false,
      nftAuctionWhitelistSize,
    } = this.parse(FeeProfileCreateVideo).flags
    const dataSizeFee = await this.getApi().dataObjectPerMegabyteFee()
    const dataObjectBloatBond = await this.getApi().dataObjectStateBloatBond()
    const videoBloatBond = await this.getApi().videoStateBloatBond()
    const mockMetadata: IVideoMetadata = {
      thumbnailPhoto: noThumbnail ? undefined : 0,
      video: noMedia ? undefined : 0,
      language: 'en',
      title: _.repeat('x', titleLen),
      description: _.repeat('x', descriptionLen),
      category: _.repeat('x', categoryLen),
      license: {
        code: 0,
      },
      mediaPixelWidth: 1920,
      mediaPixelHeight: 1080,
      isExplicit: false,
      isPublic: true,
      duration: 600,
      mediaType: {
        codecName: 'h264',
        container: 'mp4',
        mimeMediaType: 'video/mp4',
      },
      hasMarketing: false,
      subtitles: Array.from({ length: subtitlesNum }, () => ({
        language: 'en',
        mimeType: 'text/plain',
        type: 'subtitle',
        newAsset: 0,
      })),
    }

    const channelBagPolicy = await api.query.storage.dynamicBagCreationPolicies('Channel')
    const storageBucketsNum = forcedStorageBucketsNum || channelBagPolicy.numberOfStorageBuckets.toNumber()
    const mediaSize = noMedia ? 0 : inputMediaSize
    const thumbnailSize = noThumbnail ? 0 : inputThumbnailSize
    const assets = this.getAssets(dataSizeFee)
    const assetsNum = assets?.objectCreationList.length || 0
    const assetsSizeMB = mediaSize + thumbnailSize + subtitlesNum * subtitlesFileSize

    this.log(`Data fee per MB: ${chalk.cyanBright(formatBalance(dataSizeFee))}`)
    this.log(`Data object bloat bond: ${chalk.cyanBright(formatBalance(dataObjectBloatBond))}`)
    this.log(`Video bloat bond: ${chalk.cyanBright(formatBalance(videoBloatBond))}`)
    this.log('Parameters:')
    this.jsonPrettyPrint(
      JSON.stringify({
        storageBucketsNum,
        assetsNum,
        subtitlesNum,
        assetsSizeMB,
        titleLen,
        descriptionLen,
        categoryLen,
        withNft,
        nftAuctionWhitelistSize,
      })
    )

    const tx = api.tx.content.createVideo(
      { Member: 0 },
      0,
      createType('PalletContentVideoCreationParametersRecord', {
        assets,
        meta: metadataToBytes(VideoMetadata, mockMetadata),
        autoIssueNft: withNft
          ? createType('PalletContentNftTypesNftIssuanceParametersRecord', {
              nftMetadata: '',
              nonChannelOwner: null,
              royalty: null,
              initTransactionalStatus: {
                EnglishAuction: {
                  duration: 0,
                  buyNowPrice: null,
                  extensionPeriod: 0,
                  minBidStep: 0,
                  startingPrice: 0,
                  startsAt: null,
                  whitelist: Array.from({ length: nftAuctionWhitelistSize || 0 }, (v, k) => k),
                },
              },
            })
          : null,
        storageBucketsNumWitness: storageBucketsNum,
        expectedDataObjectStateBloatBond: dataObjectBloatBond,
        expectedVideoStateBloatBond: videoBloatBond,
      })
    )
    const txFee = await this.getApi().estimateFee(this.pairs.alice, tx)
    const costs = {
      dataObjectsBloatBond: dataObjectBloatBond.muln(assetsNum),
      dataObjectsSizeFee: dataSizeFee.muln(assetsSizeMB),
      videoBloatBond,
      txFee,
    }
    this.profile(costs)
  }
}
