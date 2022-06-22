import { BaseQueryNodeFixture } from '../../Fixture'
import { JoystreamCLI } from '../../cli/joystream'
import { QueryNodeApi } from '../../QueryNodeApi'
import { Api } from '../../Api'
import { Worker } from '@joystream/types/working-group'
import { getVideoCategoryDefaults, getChannelCategoryDefaults } from './contentTemplates'
import { WorkingGroupModuleName } from '../../types'
import { assert } from 'chai'

export class CreateContentStructureFixture extends BaseQueryNodeFixture {
  private cli: JoystreamCLI
  private videoCategoryCount: number
  private createdItems: {
    videoCategoryIds: number[]
  }

  constructor(api: Api, query: QueryNodeApi, cli: JoystreamCLI, videoCategoryCount: number) {
    super(api, query)
    this.cli = cli
    this.videoCategoryCount = videoCategoryCount

    this.createdItems = {
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
    Creates a new video category. Can only be executed as content group leader.
  */
  private async createVideoCategories(count: number): Promise<number[]> {
    // remember initial video categories count
    const initialVideoCategories = await this.query.tryQueryWithTimeout(
      () => this.query.getVideoCategories(),
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      (initialVideoCategories) => {}
    )
    const initialCategoryCount = initialVideoCategories.length

    // create new categories and remember their ids
    const createdIds = await this.createCommonEntities(count, async (index) => {
      const response = await this.api.createVideoCategoryAsLead(
        {
          ...getVideoCategoryDefaults(index),
        }.name
      )

      const qEvents = await this.query.tryQueryWithTimeout(
        () => this.query.getVideoCategories(),
        (qEvents) => assert.equal(qEvents.length, initialCategoryCount + index + 1)
      )
      const id = parseInt(qEvents[0].id)

      return id
    })

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
