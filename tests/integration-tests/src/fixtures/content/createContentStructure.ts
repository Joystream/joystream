import { BaseQueryNodeFixture, FixtureRunner } from '../../Fixture'
import { JoystreamCLI } from '../../cli/joystream'
import { QueryNodeApi } from '../../QueryNodeApi'
import { MemberId } from '@joystream/types/common'
import { Api } from '../../Api'
import { WorkingGroupModuleName } from '../../types'
import { Worker, WorkerId } from '@joystream/types/working-group'
import { getVideoCategoryDefaults, getChannelCategoryDefaults } from './contentTemplates'
import BN from 'bn.js'

export class CreateContentStructureFixture extends BaseQueryNodeFixture {
  private cli: JoystreamCLI
  private channelCategoryCount: number
  private videoCategoryCount: number
  private createdItems: {
    channelCategoryIds: number[]
    videoCategoryIds: number[]
  }

  constructor(
    api: Api,
    query: QueryNodeApi,
    cli: JoystreamCLI,
    channelCategoryCount: number,
    videoCategoryCount: number
  ) {
    super(api, query)
    this.cli = cli
    this.channelCategoryCount = channelCategoryCount
    this.videoCategoryCount = videoCategoryCount

    this.createdItems = {
      channelCategoryIds: [],
      videoCategoryIds: [],
    }
  }

  public getCreatedItems() {
    return this.createdItems
  }

  /*
    Execute this Fixture.
  */
  public async execute(): Promise<void> {
    // prepare accounts for working group leads

    this.debug('Loading working group leaders')
    const { contentLeader, storageLeader } = await this.retrieveWorkingGroupLeaders()

    // switch to lead and create category structure as lead

    this.debug(`Choosing content working group lead's account`)
    const contentLeaderKeyPair = this.api.getKeypair(contentLeader.role_account_id.toString())
    await this.cli.importAccount(contentLeaderKeyPair)
    await this.cli.chooseMemberAccount(contentLeader.member_id)

    this.debug('Creating channel categories')
    this.createdItems.channelCategoryIds = await this.createChannelCategories(this.channelCategoryCount)

    this.debug('Creating video categories')
    this.createdItems.videoCategoryIds = await this.createVideoCategories(this.videoCategoryCount)
  }

  /**
    Retrieves information about accounts of group leads for content and storage working groups.
  */
  private async retrieveWorkingGroupLeaders(): Promise<{ contentLeader: Worker; storageLeader: Worker }> {
    const retrieveGroupLeader = async (group: WorkingGroupModuleName) => {
      const leader = await this.api.getLeader(group)
      if (!leader) {
        throw new Error(`Working group leader for "${group}" is missing!`)
      }
      return leader[1]
    }

    return {
      contentLeader: await retrieveGroupLeader('contentWorkingGroup'),
      storageLeader: await retrieveGroupLeader('storageWorkingGroup'),
    }
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
