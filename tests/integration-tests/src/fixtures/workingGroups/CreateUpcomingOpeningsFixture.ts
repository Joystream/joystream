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
import { IOpeningMetadata, WorkingGroupMetadataAction } from '@joystream/metadata-protobuf'
import _ from 'lodash'
import Long from 'long'
import { Bytes } from '@polkadot/types'
import moment from 'moment'

export class CreateUpcomingOpeningsFixture extends BaseCreateOpeningFixture {
  protected openingsParams: UpcomingOpeningParams[]
  protected createdUpcomingOpeningIds: string[] = []

  public getDefaultOpeningParams(): Omit<UpcomingOpeningParams, 'metadata'> & { metadata: IOpeningMetadata } {
    return {
      ...super.getDefaultOpeningParams(),
      expectedStartTs: moment().unix() + 3600,
    }
  }

  public constructor(
    api: Api,
    query: QueryNodeApi,
    group: WorkingGroupModuleName,
    openingsParams?: Partial<UpcomingOpeningParams>[]
  ) {
    super(api, query, group, openingsParams)
    this.openingsParams = (openingsParams || [{}]).map((params) => ({ ...this.getDefaultOpeningParams(), ...params }))
  }

  protected async getSignerAccountOrAccounts(): Promise<string> {
    return this.api.getLeadRoleKey(this.group)
  }

  protected async getExtrinsics(): Promise<SubmittableExtrinsic<'promise'>[]> {
    return this.openingsParams.map((params) =>
      this.api.tx[this.group].setStatusText(this.getActionMetadataBytes(params))
    )
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

  protected getActionMetadataBytes(openingParams: UpcomingOpeningParams): Bytes {
    const openingMetadata = this.getMetadata(openingParams)
    console.log('OpeningMetadata', openingMetadata)
    if (!openingMetadata) {
      // Opening metadata is invalid so we just return the provided bytes
      return this.getMetadataBytes(openingParams)
    }
    return Utils.metadataToBytes(WorkingGroupMetadataAction, {
      addUpcomingOpening: {
        metadata: {
          expectedStart: openingParams.expectedStartTs,
          minApplicationStake: Long.fromString(openingParams.stake.toString()),
          rewardPerBlock: Long.fromString(openingParams.reward.toString()),
          metadata: openingMetadata,
        },
      },
    })
  }

  protected assertQueriedUpcomingOpeningsAreValid(
    qUpcomingOpenings: UpcomingOpeningFieldsFragment[],
    qEvents: StatusTextChangedEventFieldsFragment[]
  ): void {
    this.events.forEach((e, i) => {
      const openingParams = this.openingsParams[i]
      const qEvent = this.findMatchingQueryNodeEvent(e, qEvents)
      const qUpcomingOpening = qUpcomingOpenings.find((o) => o.createdInEvent.id === qEvent.id)
      if (!openingParams.expectMetadataFailue) {
        Utils.assert(qUpcomingOpening)
        assert.equal(new Date(qUpcomingOpening.expectedStart).getTime(), openingParams.expectedStartTs)
        assert.equal(qUpcomingOpening.group.name, this.group)
        assert.equal(qUpcomingOpening.rewardPerBlock, openingParams.reward.toString())
        assert.equal(qUpcomingOpening.stakeAmount, openingParams.stake.toString())
        assert.equal(qUpcomingOpening.createdAtBlock.number, e.blockNumber)
        Utils.assert(qEvent.result.__typename === 'UpcomingOpeningAdded')
        assert.equal(qEvent.result.upcomingOpeningId, qUpcomingOpening.id)
        this.assertQueriedOpeningMetadataIsValid(qUpcomingOpening.metadata, this.getMetadata(openingParams))
      } else {
        assert.isUndefined(qUpcomingOpening)
      }
    })
  }

  protected assertQueryNodeEventIsValid(qEvent: StatusTextChangedEventFieldsFragment, i: number): void {
    const openingParams = this.openingsParams[i]
    assert.equal(qEvent.event.type, EventType.StatusTextChanged)
    assert.equal(qEvent.group.name, this.group)
    assert.equal(qEvent.metadata, this.getActionMetadataBytes(openingParams).toString())
    assert.equal(
      qEvent.result.__typename,
      openingParams.expectMetadataFailue ? 'InvalidActionMetadata' : 'UpcomingOpeningAdded'
    )
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
