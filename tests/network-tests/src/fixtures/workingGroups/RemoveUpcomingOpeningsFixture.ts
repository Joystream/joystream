import { Api } from '../../Api'
import { BaseWorkingGroupFixture } from './BaseWorkingGroupFixture'
import { QueryNodeApi } from '../../QueryNodeApi'
import { EventDetails, WorkingGroupModuleName } from '../../types'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { Utils } from '../../utils'
import { ISubmittableResult } from '@polkadot/types/types/'
import { StatusTextChangedEventFieldsFragment } from '../../graphql/generated/queries'
import { assert } from 'chai'
import { WorkingGroupMetadataAction } from '@joystream/metadata-protobuf'
import { Bytes } from '@polkadot/types'

export class RemoveUpcomingOpeningsFixture extends BaseWorkingGroupFixture {
  protected upcomingOpeningIds: string[]

  public constructor(api: Api, query: QueryNodeApi, group: WorkingGroupModuleName, upcomingOpeningIds: string[]) {
    super(api, query, group)
    this.upcomingOpeningIds = upcomingOpeningIds
  }

  protected async getSignerAccountOrAccounts(): Promise<string> {
    return this.api.getLeadRoleKey(this.group)
  }

  protected async getExtrinsics(): Promise<SubmittableExtrinsic<'promise'>[]> {
    return this.upcomingOpeningIds.map((id) => {
      return this.api.tx[this.group].setStatusText(this.getActionMetadataBytes(id))
    })
  }

  protected async getEventFromResult(result: ISubmittableResult): Promise<EventDetails> {
    return this.api.getEventDetails(result, this.group, 'StatusTextChanged')
  }

  protected getActionMetadataBytes(upcomingOpeningId: string): Bytes {
    return Utils.metadataToBytes(WorkingGroupMetadataAction, {
      removeUpcomingOpening: {
        id: upcomingOpeningId,
      },
    })
  }

  protected assertQueryNodeEventIsValid(qEvent: StatusTextChangedEventFieldsFragment, i: number): void {
    assert.equal(qEvent.group.name, this.group)
    assert.equal(qEvent.metadata, this.getActionMetadataBytes(this.upcomingOpeningIds[i]).toString())
    Utils.assert(qEvent.result.__typename === 'UpcomingOpeningRemoved', 'Unexpected StatuxTextChangedEvent result type')
    assert.equal(qEvent.result.upcomingOpeningId, this.upcomingOpeningIds[i])
  }

  async runQueryNodeChecks(): Promise<void> {
    await super.runQueryNodeChecks()
    // Query & check the event
    await this.query.tryQueryWithTimeout(
      () => this.query.getStatusTextChangedEvents(this.events),
      (qEvents) => this.assertQueryNodeEventsAreValid(qEvents)
    )
    // Query the openings and make sure they no longer exist
    await Promise.all(
      this.upcomingOpeningIds.map(async (id) => {
        const qUpcomingOpening = await this.query.getUpcomingOpeningById(id)
        assert.isNull(qUpcomingOpening)
      })
    )
  }
}
