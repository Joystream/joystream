import { BaseQueryNodeFixture, FixtureRunner } from '../../Fixture'
import { JoystreamCLI, ICreatedVideoData } from '../../cli/joystream'
import { MemberId } from '@joystream/types/common'
import { QueryNodeApi } from '../../QueryNodeApi'
import { Api } from '../../Api'
import * as path from 'path'
import { getMemberDefaults, getVideoDefaults, getChannelDefaults } from './contentTemplates'
import { KeyringPair } from '@polkadot/keyring/types'
import { BuyMembershipHappyCaseFixture } from '../membership'
import BN from 'bn.js'
import { DataObjectId, StorageBucketId } from '@joystream/types/storage'
import { Worker, WorkerId } from '@joystream/types/working-group'
import { createType } from '@joystream/types'
import { singleBucketConfig } from '../../flows/storage/initStorage'
import { IMember } from './createMembers'

const cliExamplesFolderPath = path.dirname(require.resolve('@joystream/cli/package.json')) + '/examples/content'

export class CreateChannelsAndVideosFixture extends BaseQueryNodeFixture {
  private cli: JoystreamCLI
  private channelCount: number
  private videoCount: number
  private channelCategoryId: number
  private videoCategoryId: number
  private author: IMember
  private createdItems: {
    channelIds: number[]
    videosData: ICreatedVideoData[]
  }

  constructor(
    api: Api,
    query: QueryNodeApi,
    cli: JoystreamCLI,
    channelCount: number,
    videoCount: number,
    channelCategoryId: number,
    videoCategoryId: number,
    author: IMember
  ) {
    super(api, query)
    this.cli = cli
    this.channelCount = channelCount
    this.videoCount = videoCount
    this.channelCategoryId = channelCategoryId
    this.videoCategoryId = videoCategoryId
    this.author = author

    this.createdItems = {
      channelIds: [],
      videosData: [],
    }
  }

  public getCreatedItems() {
    return this.createdItems
  }

  /*
    Execute this Fixture.
  */
  public async execute(): Promise<void> {
    this.debug('Setting author')
    await this.cli.importAccount(this.author.keyringPair)
    await this.cli.chooseMemberAccount(this.author.memberId)

    this.debug('Creating channels')
    this.createdItems.channelIds = await this.createChannels(
      this.channelCount,
      this.channelCategoryId,
      this.author.account
    )

    this.debug('Creating videos')
    this.createdItems.videosData = await this.createVideos(
      this.videoCount,
      this.createdItems.channelIds[0],
      this.videoCategoryId
    )

    const { storageBucketId, storageGroupWorkerId, storageGroupWorkerAccount } = await this.retrieveBucket()

    this.debug('Accepting content to storage bag')
    const allAssetIds = this.createdItems.videosData.map((item) => item.assetContentIds).flat()
    await this.api.acceptPendingDataObjects(
      storageGroupWorkerAccount,
      storageGroupWorkerId,
      storageBucketId,
      this.createdItems.channelIds[0].toString(),
      allAssetIds
    )
  }

  /**
    Retrieves storage bucket info.
  */
  private async retrieveBucket(): Promise<{
    storageBucketId: StorageBucketId
    storageGroupWorkerId: WorkerId
    storageGroupWorkerAccount: string
  }> {
    // read existing storage buckets from runtime
    const bucketEntries = await this.api.query.storage.storageBucketById.entries()

    // create WorkerId object
    const storageGroupWorkerId = createType('WorkerId', singleBucketConfig.buckets[0].operatorId)

    // find some bucket created by worker
    const bucketTuple = bucketEntries.find(
      ([, /* storageBucketId */ storageBucket]) =>
        (storageBucket.operator_status as any).isStorageWorker &&
        (storageBucket.operator_status as any).asStorageWorker[0].toString() === storageGroupWorkerId.toString()
    )
    if (!bucketTuple) {
      throw new Error('Storage bucket not initialized')
    }

    // retrieve worker address
    const storageGroupWorkerAccount = this.api.createCustomKeyPair(singleBucketConfig.buckets[0].transactorUri, true)
      .address

    // create StorageBucketId object
    const storageBucketId = createType('StorageBucketId', bucketTuple[0].args[0])

    return {
      storageBucketId,
      storageGroupWorkerId,
      storageGroupWorkerAccount,
    }
  }

  /**
    Creates a new channel.
  */
  private async createChannels(count: number, channelCategoryId: number, authorAddress: string): Promise<number[]> {
    const createdIds = (await this.createCommonEntities(count, (index) =>
      this.cli.createChannel({
        ...getChannelDefaults(index, authorAddress),
        category: channelCategoryId,
      })
    )) as number[]

    return createdIds
  }

  /**
    Creates a new video.

    Note: Assets have to be accepted later on for videos to be counted as active.
  */
  private async createVideos(count: number, channelId: number, videoCategoryId: number): Promise<ICreatedVideoData[]> {
    const createVideo = async (index: number) => {
      return await this.cli.createVideo(channelId, {
        ...getVideoDefaults(index, cliExamplesFolderPath),
        category: videoCategoryId,
      })
    }
    const newVideosData = (await this.createCommonEntities(count, createVideo)) as ICreatedVideoData[]

    return newVideosData
  }

  /**
    Creates a bunch of content entities.
  */
  private async createCommonEntities<T>(count: number, createPromise: (index: number) => Promise<T>): Promise<T[]> {
    const createdIds = await Array.from(Array(count).keys()).reduce(async (accPromise, index: number) => {
      const acc = await accPromise
      const createdId = await createPromise(index)

      return [...acc, createdId]
    }, Promise.resolve([]) as Promise<T[]>)

    return createdIds
  }
}
