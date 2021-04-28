import { Api } from '../../Api'
import { BaseCreateOpeningFixture, OpeningParams } from './BaseCreateOpeningFixture'
import { QueryNodeApi } from '../../QueryNodeApi'
import { OpeningAddedEventDetails, WorkingGroupModuleName } from '../../types'
import { OpeningId } from '@joystream/types/working-group'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { Utils } from '../../utils'
import { ISubmittableResult } from '@polkadot/types/types/'
import { OpeningAddedEventFieldsFragment, OpeningFieldsFragment } from '../../graphql/generated/queries'
import { EventType, WorkingGroupOpeningType } from '../../graphql/generated/schema'
import { assert } from 'chai'

export class CreateOpeningsFixture extends BaseCreateOpeningFixture {
  protected asSudo: boolean
  protected events: OpeningAddedEventDetails[] = []

  public constructor(
    api: Api,
    query: QueryNodeApi,
    group: WorkingGroupModuleName,
    openingsParams?: Partial<OpeningParams>[],
    asSudo = false
  ) {
    super(api, query, group, openingsParams)
    this.asSudo = asSudo
  }

  public getCreatedOpeningIds(): OpeningId[] {
    if (!this.events.length) {
      throw new Error('Trying to get created opening ids before they were created!')
    }
    return this.events.map((e) => e.openingId)
  }

  protected async getSignerAccountOrAccounts(): Promise<string> {
    return this.asSudo ? (await this.api.query.sudo.key()).toString() : await this.api.getLeadRoleKey(this.group)
  }

  protected async getExtrinsics(): Promise<SubmittableExtrinsic<'promise'>[]> {
    const extrinsics = this.openingsParams.map((params) =>
      this.api.tx[this.group].addOpening(
        this.getMetadataBytes(params),
        this.asSudo ? 'Leader' : 'Regular',
        { stake_amount: params.stake, leaving_unstaking_period: params.unstakingPeriod },
        params.reward
      )
    )

    return this.asSudo ? extrinsics.map((tx) => this.api.tx.sudo.sudo(tx)) : extrinsics
  }

  protected async getEventFromResult(result: ISubmittableResult): Promise<OpeningAddedEventDetails> {
    return this.api.retrieveOpeningAddedEventDetails(result, this.group)
  }

  protected assertQueriedOpeningsAreValid(qOpenings: OpeningFieldsFragment[]): void {
    this.events.map((e, i) => {
      const qOpening = qOpenings.find((o) => o.runtimeId === e.openingId.toNumber())
      const openingParams = this.openingsParams[i]
      Utils.assert(qOpening, 'Query node: Opening not found')
      assert.equal(qOpening.runtimeId, e.openingId.toNumber())
      assert.equal(qOpening.createdAtBlock.number, e.blockNumber)
      assert.equal(qOpening.group.name, this.group)
      assert.equal(qOpening.rewardPerBlock, openingParams.reward.toString())
      assert.equal(qOpening.type, this.asSudo ? WorkingGroupOpeningType.Leader : WorkingGroupOpeningType.Regular)
      assert.equal(qOpening.status.__typename, 'OpeningStatusOpen')
      assert.equal(qOpening.stakeAmount, openingParams.stake.toString())
      assert.equal(qOpening.unstakingPeriod, openingParams.unstakingPeriod)
      // Metadata
      if (openingParams.expectMetadataFailue) {
        this.assertQueriedOpeningMetadataIsValid(qOpening.metadata, this.getDefaultQueryNodeMetadata(this.asSudo))
      } else {
        this.assertQueriedOpeningMetadataIsValid(qOpening.metadata, this.getMetadata(openingParams))
      }
    })
  }

  protected assertQueryNodeEventIsValid(qEvent: OpeningAddedEventFieldsFragment, i: number): void {
    assert.equal(qEvent.event.type, EventType.OpeningAdded)
    assert.equal(qEvent.group.name, this.group)
    assert.equal(qEvent.opening.runtimeId, this.events[i].openingId.toNumber())
  }

  async runQueryNodeChecks(): Promise<void> {
    await super.runQueryNodeChecks()
    // Query the events
    await this.query.tryQueryWithTimeout(
      () => this.query.getOpeningAddedEvents(this.events),
      (qEvents) => this.assertQueryNodeEventsAreValid(qEvents)
    )

    // Query the openings
    const qOpenings = await this.query.getOpeningsByIds(
      this.events.map((e) => e.openingId),
      this.group
    )
    this.assertQueriedOpeningsAreValid(qOpenings)
  }
}
