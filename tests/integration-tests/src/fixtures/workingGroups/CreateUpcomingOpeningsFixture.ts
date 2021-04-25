import { Api } from '../../Api'
import { BaseCreateOpeningFixture, UpcomingOpeningParams } from './BaseCreateOpeningFixture'
import { QueryNodeApi } from '../../QueryNodeApi'
import { EventDetails, WorkingGroupModuleName } from '../../types'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { Utils } from '../../utils'
import { ISubmittableResult } from '@polkadot/types/types/'
import { StatusTextChangedEventFieldsFragment, UpcomingOpeningFieldsFragment } from '../../graphql/generated/queries'
import { EventType } from '../../graphql/generated/schema'
import { assert } from 'chai'
import { AddUpcomingOpening, UpcomingOpeningMetadata, WorkingGroupMetadataAction } from '@joystream/metadata-protobuf'
import _ from 'lodash'

export class CreateUpcomingOpeningsFixture extends BaseCreateOpeningFixture {
  protected openingsParams: UpcomingOpeningParams[]
  protected createdUpcomingOpeningIds: string[] = []

  public getDefaultOpeningParams(): UpcomingOpeningParams {
    return {
      ...super.getDefaultOpeningParams(),
      expectedStartTs: Date.now() + 3600,
    }
  }

  public constructor(
    api: Api,
    query: QueryNodeApi,
    group: WorkingGroupModuleName,
    openingsParams?: Partial<UpcomingOpeningParams>[]
  ) {
    super(api, query, group, openingsParams)
    this.openingsParams = (openingsParams || [{}]).map((params) => _.merge(this.getDefaultOpeningParams(), params))
  }

  protected async getSignerAccountOrAccounts(): Promise<string> {
    return this.api.getLeadRoleKey(this.group)
  }

  protected async getExtrinsics(): Promise<SubmittableExtrinsic<'promise'>[]> {
    return this.openingsParams.map((params) => {
      const metaBytes = Utils.metadataToBytes(this.getActionMetadata(params))
      return this.api.tx[this.group].setStatusText(metaBytes)
    })
  }

  protected async getEventFromResult(result: ISubmittableResult): Promise<EventDetails> {
    return this.api.retrieveWorkingGroupsEventDetails(result, this.group, 'StatusTextChanged')
  }

  public getCreatedUpcomingOpeningIds(): string[] {
    if (!this.createdUpcomingOpeningIds.length) {
      throw new Error('Trying to get created UpcomingOpening ids before they are known')
    }
    return this.createdUpcomingOpeningIds
  }

  protected getActionMetadata(openingParams: UpcomingOpeningParams): WorkingGroupMetadataAction {
    const actionMeta = new WorkingGroupMetadataAction()
    const addUpcomingOpeningMeta = new AddUpcomingOpening()

    const upcomingOpeningMeta = new UpcomingOpeningMetadata()
    const openingMeta = this.getMetadata(openingParams)
    upcomingOpeningMeta.setMetadata(openingMeta)
    upcomingOpeningMeta.setExpectedStart(openingParams.expectedStartTs)
    upcomingOpeningMeta.setMinApplicationStake(openingParams.stake.toNumber())
    upcomingOpeningMeta.setRewardPerBlock(openingParams.reward.toNumber())

    addUpcomingOpeningMeta.setMetadata(upcomingOpeningMeta)
    actionMeta.setAddUpcomingOpening(addUpcomingOpeningMeta)

    return actionMeta
  }

  protected assertQueriedUpcomingOpeningsAreValid(
    qUpcomingOpenings: UpcomingOpeningFieldsFragment[],
    qEvents: StatusTextChangedEventFieldsFragment[]
  ): void {
    this.events.forEach((e, i) => {
      const openingParams = this.openingsParams[i]
      const qEvent = this.findMatchingQueryNodeEvent(e, qEvents)
      const qUpcomingOpening = qUpcomingOpenings.find((o) => o.createdInEvent.id === qEvent.id)
      Utils.assert(qUpcomingOpening)
      assert.equal(new Date(qUpcomingOpening.expectedStart).getTime(), openingParams.expectedStartTs)
      assert.equal(qUpcomingOpening.group.name, this.group)
      assert.equal(qUpcomingOpening.rewardPerBlock, openingParams.reward.toString())
      assert.equal(qUpcomingOpening.stakeAmount, openingParams.stake.toString())
      assert.equal(qUpcomingOpening.createdAtBlock.number, e.blockNumber)
      this.assertQueriedOpeningMetadataIsValid(openingParams, qUpcomingOpening.metadata)
      Utils.assert(qEvent.result.__typename === 'UpcomingOpeningAdded')
      assert.equal(qEvent.result.upcomingOpeningId, qUpcomingOpening.id)
    })
  }

  protected assertQueryNodeEventIsValid(qEvent: StatusTextChangedEventFieldsFragment, i: number): void {
    assert.equal(qEvent.event.type, EventType.StatusTextChanged)
    assert.equal(qEvent.group.name, this.group)
    assert.equal(qEvent.metadata, Utils.metadataToBytes(this.getActionMetadata(this.openingsParams[i])).toString())
    assert.equal(qEvent.result.__typename, 'UpcomingOpeningAdded')
  }

  async runQueryNodeChecks(): Promise<void> {
    await super.runQueryNodeChecks()
    // Query the event
    const qEvents = await this.query.tryQueryWithTimeout(
      () => this.query.getStatusTextChangedEvents(this.events),
      (qEvents) => this.assertQueryNodeEventsAreValid(qEvents)
    )
    // Query the opening
    const qUpcomingOpenings = await this.query.getUpcomingOpeningsByCreatedInEventIds(qEvents.map((e) => e.id))
    this.assertQueriedUpcomingOpeningsAreValid(qUpcomingOpenings, qEvents)

    this.createdUpcomingOpeningIds = qUpcomingOpenings.map((o) => o.id)
  }
}
