import { BaseQueryNodeFixture, FixtureRunner } from '../../Fixture'
import { JoystreamCLI } from '../../cli/joystream'
import { QueryNodeApi } from '../../QueryNodeApi'
import { PaidTermId, MemberId } from '@joystream/types/members'
import { Debugger, extendDebug } from '../../Debugger'
import { Api } from '../../Api'
import { WorkingGroups } from '../../WorkingGroups'
import { Worker, WorkerId } from '@joystream/types/working-group'
import { getVideoCategoryDefaults, getChannelCategoryDefaults } from './contentTemplates'
import BN from 'bn.js'

export class CreateContentStructureFixture extends BaseQueryNodeFixture {
  private debug: Debugger.Debugger
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
    this.debug = extendDebug('fixture:CreateContentStructureFixture')

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
    const retrieveGroupLeader = async (group: WorkingGroups) => {
      const leader = await this.api.getGroupLead(group)
      if (!leader) {
        throw new Error(`Working group leader for "${group}" is missing!`)
      }
      return leader
    }

    return {
      contentLeader: await retrieveGroupLeader(WorkingGroups.Content),
      storageLeader: await retrieveGroupLeader(WorkingGroups.Storage),
    }
  }

  /**
    Creates a new channel category. Can only be executed as content group leader.
  */
  private async createChannelCategories(count: number): Promise<number[]> {
    const createdIds = await this.createCommonEntities(count, (index) =>
      this.cli.createChannelCategory({
        ...getChannelCategoryDefaults(index),
      })
    )

    return createdIds
  }

  /**
    Creates a new video category. Can only be executed as content group leader.
  */
  private async createVideoCategories(count: number): Promise<number[]> {
    const createdIds = await this.createCommonEntities(count, (index) =>
      this.cli.createVideoCategory({
        ...getVideoCategoryDefaults(index),
      })
    )

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
