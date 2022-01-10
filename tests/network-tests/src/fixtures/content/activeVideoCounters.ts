import { assert } from 'chai'
import { ApolloQueryResult } from '@apollo/client'
import { Api, WorkingGroups } from '../../Api'
import { BaseQueryNodeFixture, FixtureRunner } from '../../Fixture'
import { BuyMembershipHappyCaseFixture } from '../membershipModule'
import { KeyringPair } from '@polkadot/keyring/types'
import { Bytes } from '@polkadot/types'
import { QueryNodeApi } from '../../QueryNodeApi'
import { CliApi, ICreatedVideoData } from '../../CliApi'
import { PaidTermId, MemberId } from '@joystream/types/members'
import { Debugger, extendDebug } from '../../Debugger'
import BN from 'bn.js'
import { addWorkerToGroup } from './addWorkerToGroup'
import { Worker, WorkerId } from '@joystream/types/working-group'
import {
  getMemberDefaults,
  getChannelCategoryDefaults,
  getChannelDefaults,
  getVideoDefaults,
  getVideoCategoryDefaults,
} from './contentTemplates'

interface IMember {
  keyringPair: KeyringPair
  account: string
  memberId: MemberId
}

// QN connection paramaters
const qnConnection = {
  numberOfRepeats: 20, // QN can take some time to catch up with node - repeat until then
  repeatDelay: 3000, // delay between failed QN requests
}

// settings
const contentDirectoryWorkingGroupId = 1 // TODO: retrieve group id programmatically
const sufficientTopupAmount = new BN(1000000) // some very big number to cover fees of all transactions

/**
  Fixture that test Joystream content can be created, is reflected in query node,
  and channel and categories counts their active videos properly.
*/
export class ActiveVideoCountersFixture extends BaseQueryNodeFixture {
  private paidTerms: PaidTermId
  private debug: Debugger.Debugger
  private env: NodeJS.ProcessEnv

  constructor(api: Api, query: QueryNodeApi, cli: CliApi, env: NodeJS.ProcessEnv, paidTerms: PaidTermId) {
    super(api, query, cli)
    this.paidTerms = paidTerms
    this.env = env
    this.debug = extendDebug('fixture:ActiveVideoCountersFixture')
  }

  // this could be used by other modules in some shared fixture or whatnot; membership creation is common to many flows
  private async createMembers(numberOfMembers: number): Promise<IMember[]> {
    const keyringPairs = (await this.api.createKeyPairs(numberOfMembers)).map((kp) => kp.key)
    const accounts = keyringPairs.map((item) => item.address)
    const buyMembershipsFixture = new BuyMembershipHappyCaseFixture(this.api, accounts, this.paidTerms)

    await new FixtureRunner(buyMembershipsFixture).run()

    const memberIds = buyMembershipsFixture.getCreatedMembers()

    return keyringPairs.map((item, index) => ({
      keyringPair: item,
      account: accounts[index],
      memberId: memberIds[index],
    }))
  }

  /*
    Topup a bunch of accounts by specified amount.
  */
  private async topupAddresses(accounts: string[], amount: BN) {
    await this.api.treasuryTransferBalanceToAccounts(accounts, amount)
  }

  /*
    Execute this Fixture.
  */
  public async execute(): Promise<void> {
    const videoCount = 2
    const videoCategoryCount = 2
    const channelCount = 2
    const channelCategoryCount = 2

    // prepare accounts for group leads, storage worker, and content author

    this.debug('Loading working group leaders')
    const { contentLeader, storageLeader } = await this.retrieveWorkingGroupLeaders()

    // prepare memberships
    this.debug('Creating members')
    const members = await this.createMembers(1)

    const authorMemberIndex = 0
    const author = members[authorMemberIndex]
    author.keyringPair.setMeta({
      ...author.keyringPair.meta,
      ...getMemberDefaults(authorMemberIndex),
    })
    const storageGroupWorker = author

    this.debug('Top-uping accounts')
    await this.topupAddresses(
      [
        ...members.map((item) => item.keyringPair.address),
        contentLeader.role_account_id.toString(),
        storageLeader.role_account_id.toString(),
      ],
      sufficientTopupAmount
    )

    // switch to lead and create category structure as lead

    this.debug(`Choosing content working group lead's account`)
    // this expects lead account to be already imported into CLI
    await this.cli.chooseAccount(contentLeader.role_account_id.toString())

    this.debug('Creating channel categories')
    const channelCategoryIds = await this.createChannelCategories(channelCategoryCount)

    this.debug('Creating video categories')
    const videoCategoryIds = await this.createVideoCategories(videoCategoryCount)

    // switch to authors account

    this.debug(`Importing author's account`)
    await this.cli.importAccount(author.keyringPair)
    await this.cli.chooseAccount(author.keyringPair.address)

    // create content entities

    this.debug('Creating channels')
    const channelIds = await this.createChannels(channelCount, channelCategoryIds[0], author.account)

    this.debug('Creating videos')
    const videosData = await this.createVideos(videoCount, channelIds[0], videoCategoryIds[0])

    // add `storageGroupWorker` to storage group and accept all storage content

    this.debug('Adding worker to content directory group')
    const workerId = await addWorkerToGroup(
      this.api,
      this.env,
      WorkingGroups.StorageWorkingGroup,
      storageGroupWorker.keyringPair.address
    )

    this.debug('Accepting content')
    const allAssetIds = videosData.map((item) => item.assetContentIds).flat()
    await Promise.all(
      allAssetIds.map(async (contentIdHex) => {
        const contentId = this.api.unpackContentId(contentIdHex)
        await this.api.acceptContent(storageGroupWorker.keyringPair.address, workerId.toNumber(), contentId)
      })
    )

    // check channel and categories con are counted as active

    this.debug('Checking channels active video counters')
    await this.assertCounterMatch('channels', channelIds[0], videoCount)

    this.debug('Checking channel categories active video counters')
    await this.assertCounterMatch('channelCategories', channelCategoryIds[0], videoCount)

    this.debug('Checking video categories active video counters')
    await this.assertCounterMatch('videoCategories', videoCategoryIds[0], videoCount)

    // move channel to different channel category and video to different videoCategory

    const oneMovedVideoCount = 1
    this.debug('Move channel to different channel category')
    await this.cli.updateChannel(channelIds[0], {
      category: channelCategoryIds[1], // move from category 1 to category 2
    })

    this.debug('Move video to different video category')
    await this.cli.updateVideo(videosData[0].videoId, {
      category: videoCategoryIds[1], // move from category 1 to category 2
    })

    // check counters of channel category and video category with newly moved in video/channel

    this.debug('Checking channel categories active video counters (2)')
    await this.assertCounterMatch('channelCategories', channelCategoryIds[1], videoCount)

    this.debug('Checking video categories active video counters (2)')
    await this.assertCounterMatch('videoCategories', videoCategoryIds[1], oneMovedVideoCount)

    /** Sumer doesn't support changing channels - uncoment this on later releases where it's supported

    // move one video to another channel

    this.debug('Move video to different channel')
    await this.cli.updateVideo(videosData[0].videoId, {
      channel: channelIds[1], // move from channel 1 to channel 2
    })

    // check counter of channel with newly moved video

    this.debug('Checking channels active video counters (2)')
    await this.assertCounterMatch('channels', channelIds[0], videoCount - oneMovedVideoCount)
    await this.assertCounterMatch('channels', channelIds[1], oneMovedVideoCount)

    // end
    */

    this.debug('Done')
  }

  /**
    Asserts a channel, or a video/channel categories have their active videos counter set properly
    in Query node.
  */
  private async assertCounterMatch(
    entityName: 'channels' | 'channelCategories' | 'videoCategories',
    entityId: number,
    expectedCount: number
  ) {
    const qnConnectionNumberOfRepeats = 10

    const getterName = `get${entityName[0].toUpperCase()}${entityName.slice(1)}`
    await this.query.tryQueryWithTimeout(
      () => (this.query as any)[getterName](),
      (tmpEntity) => {
        const entities = (tmpEntity as any).data[entityName]
        assert(entities.length > 0) // some entities were loaded

        const entity = entities.find((item: any) => item.id === entityId.toString())

        // all videos created in this fixture should be active and belong to first entity
        assert(entity.activeVideosCounter === expectedCount)
      },
      qnConnection.repeatDelay,
      qnConnection.numberOfRepeats
    )
  }

  /**
    Retrieves information about accounts of group leads for content and storage working groups.
  */
  private async retrieveWorkingGroupLeaders(): Promise<{ contentLeader: Worker; storageLeader: Worker }> {
    const contentLeader = await this.api.getGroupLead(WorkingGroups.ContentDirectoryWorkingGroup)
    if (!contentLeader) {
      throw new Error('Working group leader is missing!')
    }

    const storageLeader = await this.api.getGroupLead(WorkingGroups.StorageWorkingGroup)
    if (!storageLeader) {
      throw new Error('Working group leader is missing!')
    }

    return {
      contentLeader,
      storageLeader,
    }
  }

  /**
    Creates a new video.

    Note: Assets have to be accepted later on for videos to be counted as active.
  */
  private async createVideos(count: number, channelId: number, videoCategoryId: number): Promise<ICreatedVideoData[]> {
    const createVideo = async (index: number) => {
      return await this.cli.createVideo(channelId, {
        ...getVideoDefaults(index, this.cli.cliExamplesFolderPath),
        category: videoCategoryId,
      })
    }
    const newVideosData = (await this.createCommonEntities(count, createVideo)) as ICreatedVideoData[]

    return newVideosData
  }

  /**
    Creates a new video category. Can only be executed as content group leader.
  */
  private async createVideoCategories(count: number): Promise<number[]> {
    const createdIds = (await this.createCommonEntities(count, (index) =>
      this.cli.createVideoCategory({
        ...getVideoCategoryDefaults(index),
      })
    )) as number[]

    return createdIds
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
    Creates a new channel category. Can only be executed as content group leader.
  */
  private async createChannelCategories(count: number): Promise<number[]> {
    const createdIds = (await this.createCommonEntities(count, (index) =>
      this.cli.createChannelCategory({
        ...getChannelCategoryDefaults(index),
      })
    )) as number[]

    return createdIds
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
