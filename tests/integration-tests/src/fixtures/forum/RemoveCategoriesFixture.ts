import { Api } from '../../Api'
import { QueryNodeApi } from '../../QueryNodeApi'
import { EventDetails } from '../../types'
import { WorkerId } from '@joystream/types/working-group'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { Utils } from '../../utils'
import { ISubmittableResult } from '@polkadot/types/types/'
import { CategoryDeletedEventFieldsFragment, ForumCategoryFieldsFragment } from '../../graphql/generated/queries'
import { assert } from 'chai'
import { CategoryId } from '@joystream/types/forum'
import { WithForumLeadFixture } from './WithForumLeadFixture'

export type CategoryRemovalInput = {
  categoryId: CategoryId
  asWorker?: WorkerId
}

export class RemoveCategoriesFixture extends WithForumLeadFixture {
  protected removals: CategoryRemovalInput[]

  public constructor(api: Api, query: QueryNodeApi, removals: CategoryRemovalInput[]) {
    super(api, query)
    this.removals = removals
  }

  protected async getSignerAccountOrAccounts(): Promise<string[]> {
    return Promise.all(
      this.removals.map(async (r) => {
        const workerId = r.asWorker || (await this.getForumLeadId())
        return (await this.api.query.forumWorkingGroup.workerById(workerId)).role_account_id.toString()
      })
    )
  }

  protected async getExtrinsics(): Promise<SubmittableExtrinsic<'promise'>[]> {
    return this.removals.map((u) =>
      this.api.tx.forum.deleteCategory(u.asWorker ? { Moderator: u.asWorker } : { Lead: null }, u.categoryId)
    )
  }

  protected async getEventFromResult(result: ISubmittableResult): Promise<EventDetails> {
    return this.api.retrieveForumEventDetails(result, 'CategoryDeleted')
  }

  protected assertQueriedCategoriesAreValid(
    qCategories: ForumCategoryFieldsFragment[],
    qEvents: CategoryDeletedEventFieldsFragment[]
  ): void {
    this.events.map((e, i) => {
      const removal = this.removals[i]
      const qCategory = qCategories.find((c) => c.id === removal.categoryId.toString())
      const qEvent = this.findMatchingQueryNodeEvent(e, qEvents)
      Utils.assert(qCategory, 'Query node: Category not found')
      Utils.assert(qCategory.status.__typename === 'CategoryStatusRemoved', 'Invalid category status')
      assert.equal(qCategory.status.categoryDeletedEventId, qEvent.id)
    })
  }

  protected assertQueryNodeEventIsValid(qEvent: CategoryDeletedEventFieldsFragment, i: number): void {
    const { categoryId, asWorker } = this.removals[i]
    assert.equal(qEvent.category.id, categoryId.toString())
    assert.equal(qEvent.actor.id, `forumWorkingGroup-${asWorker ? asWorker.toString() : this.forumLeadId!.toString()}`)
  }

  async runQueryNodeChecks(): Promise<void> {
    await super.runQueryNodeChecks()
    // Query the events
    const qEvents = await this.query.tryQueryWithTimeout(
      () => this.query.getCategoryDeletedEvents(this.events),
      (qEvents) => this.assertQueryNodeEventsAreValid(qEvents)
    )

    // Query the categories
    const qCategories = await this.query.getCategoriesByIds(this.removals.map((r) => r.categoryId))
    this.assertQueriedCategoriesAreValid(qCategories, qEvents)
  }
}
