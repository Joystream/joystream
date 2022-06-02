import { assert } from 'chai'
import { Api } from '../../Api'
import { QueryNodeApi } from '../../QueryNodeApi'
import { EventDetails, WorkingGroupModuleName } from '../../types'
import { BaseWorkingGroupFixture } from './BaseWorkingGroupFixture'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { ISubmittableResult } from '@polkadot/types/types/'
import { Utils } from '../../utils'
import { OpeningId } from '@joystream/types/working-group'
import {
  ApplicationBasicFieldsFragment,
  OpeningCanceledEventFieldsFragment,
  OpeningFieldsFragment,
} from '../../graphql/generated/queries'

export class CancelOpeningsFixture extends BaseWorkingGroupFixture {
  protected openingIds: OpeningId[]

  public constructor(api: Api, query: QueryNodeApi, group: WorkingGroupModuleName, openingIds: OpeningId[]) {
    super(api, query, group)
    this.openingIds = openingIds
  }

  protected async getSignerAccountOrAccounts(): Promise<string> {
    return this.api.getLeadRoleKey(this.group)
  }

  protected async getExtrinsics(): Promise<SubmittableExtrinsic<'promise'>[]> {
    return this.openingIds.map((id) => this.api.tx[this.group].cancelOpening(id))
  }

  protected async getEventFromResult(result: ISubmittableResult): Promise<EventDetails> {
    return this.api.getEventDetails(result, this.group, 'OpeningCanceled')
  }

  protected assertQueriedOpeningsAreValid(
    qEvents: OpeningCanceledEventFieldsFragment[],
    qOpenings: OpeningFieldsFragment[]
  ): void {
    this.events.map((e, i) => {
      const openingId = this.openingIds[i]
      const qEvent = this.findMatchingQueryNodeEvent(e, qEvents)
      const qOpening = qOpenings.find((o) => o.runtimeId === openingId.toNumber())
      Utils.assert(qOpening)
      Utils.assert(qOpening.status.__typename === 'OpeningStatusCancelled', 'Query node: Invalid opening status')
      Utils.assert(qOpening.status.openingCanceledEvent, 'Query node: Missing openingCanceledEvent relation')
      assert.equal(qOpening.status.openingCanceledEvent.id, qEvent.id)
      qOpening.applications.forEach((a) => this.assertApplicationStatusIsValid(qEvent, a))
    })
  }

  protected assertApplicationStatusIsValid(
    qEvent: OpeningCanceledEventFieldsFragment,
    qApplication: ApplicationBasicFieldsFragment
  ): void {
    // It's possible that some of the applications have been withdrawn
    assert.oneOf(qApplication.status.__typename, ['ApplicationStatusWithdrawn', 'ApplicationStatusCancelled'])
    if (qApplication.status.__typename === 'ApplicationStatusCancelled') {
      // FIXME: Missing due to Hydra bug now
      // Utils.assert(qApplication.status.openingCanceledEvent, 'Query node: Missing openingCanceledEvent relation')
      // assert.equal(qApplication.status.openingCanceledEvent.id, qEvent.id)
    }
  }

  protected assertQueryNodeEventIsValid(qEvent: OpeningCanceledEventFieldsFragment, i: number): void {
    assert.equal(qEvent.group.name, this.group)
    assert.equal(qEvent.opening.runtimeId, this.openingIds[i].toNumber())
  }

  async runQueryNodeChecks(): Promise<void> {
    await super.runQueryNodeChecks()
    const qEvents = await this.query.tryQueryWithTimeout(
      () => this.query.getOpeningCancelledEvents(this.events),
      (qEvents) => this.assertQueryNodeEventsAreValid(qEvents)
    )
    const qOpenings = await this.query.getOpeningsByIds(this.openingIds, this.group)
    this.assertQueriedOpeningsAreValid(qEvents, qOpenings)
  }
}
