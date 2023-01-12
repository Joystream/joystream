import BN from 'bn.js'
import { createType } from '@joystream/types'
import { BaseQueryNodeFixture, FixtureRunner } from 'src/Fixture'
import { BuyMembershipHappyCaseFixture } from '../membership'
import { CreateProposalsFixture, DecideOnProposalStatusFixture } from '../proposals'
import { EventDetails } from '@joystream/cli/src/Types'
import { EventType, WorkingGroupModuleName } from 'src/types'
import { OpeningAddedEventFieldsFragment, OpeningFieldsFragment } from 'src/graphql/generated/queries'
import { OpeningId } from '@joystream/types/primitives'
import { IOpeningMetadata, OpeningMetadata } from '@joystream/metadata-protobuf'
import { assert } from 'chai'
import { QueryNodeApi } from 'src/QueryNodeApi'
import { Api } from 'src/Api'
import { Utils } from '../../utils'
import { WorkingGroupOpeningType } from 'src/graphql/generated/schema'
import { assertQueriedOpeningMetadataIsValid } from './utils'
import moment from 'moment'

export const createDefaultOpeningParams = (
  api: Api
): Omit<OpeningParams, 'metadata'> & { metadata: IOpeningMetadata } => {
  return {
    stake: api.consts.contentWorkingGroup.minimumApplicationStake,
    unstakingPeriod: api.consts.contentWorkingGroup.minUnstakingPeriodLimit.toNumber(),
    reward: new BN(10),
    metadata: {
      shortDescription: 'Test opening',
      description: '# Test opening',
      expectedEndingTimestamp: moment().unix() + 60,
      hiringLimit: 1,
      applicationDetails: '- This is automatically created opening, do not apply!',
      applicationFormQuestions: [
        { question: 'Question 1?', type: OpeningMetadata.ApplicationFormQuestion.InputType.TEXT },
        { question: 'Question 2?', type: OpeningMetadata.ApplicationFormQuestion.InputType.TEXTAREA },
      ],
    },
  }
}
type OpeningAddedEventDetails = EventDetails<EventType<'contentWorkingGroup', 'OpeningAdded'>>

export type OpeningParams = {
  stake: BN
  unstakingPeriod: number
  reward: BN
  metadata: IOpeningMetadata | string
  expectMetadataFailure?: boolean
}

export class CreateLeadOpeningsFixture extends BaseQueryNodeFixture {
  protected events: OpeningAddedEventDetails[] = []
  protected openingParams: OpeningParams
  protected group: WorkingGroupModuleName

  public constructor(
    api: Api,
    query: QueryNodeApi,
    openingParams: OpeningParams,
    group: WorkingGroupModuleName,
  ) {
    super(api, query,)
    this.openingParams = openingParams 
    this.group = group
  }

  public async execute(): Promise<void> {
    const { api, query } = this

    // member proposer
    const [memberAcc] = (await api.createKeyPairs(1)).map(({ key }) => key.address)
    const buyMembershipFixture = new BuyMembershipHappyCaseFixture(api, query, [memberAcc])
    await new FixtureRunner(buyMembershipFixture).run()
    const [memberId] = buyMembershipFixture.getCreatedMembers()

    // create lead opening proposal
    const createProposalsFixture = new CreateProposalsFixture(api, query, [
      {
        type: 'CreateWorkingGroupLeadOpening',
        details: createType('PalletProposalsCodexCreateOpeningParameters', {
          'description': createType('Bytes', 'Proposal to hire lead'),
          'stakePolicy': createType('PalletWorkingGroupStakePolicy', {
            'stakeAmount': this.openingParams.stake,
            'leavingUnstakingPeriod': this.openingParams.unstakingPeriod,
          }),
          'rewardPerBlock': this.openingParams.reward,
          'group': createType('PalletCommonWorkingGroupIterableEnumsWorkingGroup', 'Content'),
        }),
        asMember: memberId,
        title: 'To be cancelled by runtime',
        description: 'Proposal to be cancelled by runtime',
      },
    ])
    await new FixtureRunner(createProposalsFixture).run()
    const [createOpeninProposalId] = createProposalsFixture.getCreatedProposalsIds()

    // have the proposal approved
    const decideOnProposalStatusFixture = new DecideOnProposalStatusFixture(api, query, [
      { proposalId: createOpeninProposalId, status: 'Approved' },
    ])
    await new FixtureRunner(decideOnProposalStatusFixture).run()
  }

  public getCreatedOpeningIds(): OpeningId[] {
    if (!this.events.length) {
      throw new Error('Trying to get created opening ids before they were created!')
    }
    return this.events.map((e) => e.event.data[0])
  }

  protected assertQueriedOpeningsAreValid(
    qOpenings: OpeningFieldsFragment[],
    qEvents: OpeningAddedEventFieldsFragment[]
  ): void {
    // TODO add several opeining Params
    this.events.map((e, i) => {
      const qOpening = qOpenings.find((o) => o.runtimeId === e.event.data[0].toNumber())
      const openingParams = this.openingParams
      const qEvent = this.findMatchingQueryNodeEvent(e, qEvents)
      Utils.assert(qOpening, 'Query node: Opening not found')
      assert.equal(qOpening.runtimeId, e.event.data[0].toNumber())
      assert.equal(qOpening.createdInEvent.id, qEvent.id)
      assert.equal(qOpening.group.name, this.group)
      assert.equal(qOpening.rewardPerBlock, openingParams.reward.toString())
      assert.equal(qOpening.type, WorkingGroupOpeningType.Regular)
      assert.equal(qOpening.status.__typename, 'OpeningStatusOpen')
      assert.equal(qOpening.stakeAmount, openingParams.stake.toString())
      assert.equal(qOpening.unstakingPeriod, openingParams.unstakingPeriod)
      // Metadata
      assertQueriedOpeningMetadataIsValid(qOpening.metadata, this.getOpeningMetadata(openingParams))
    })
  }

  protected assertQueryNodeEventIsValid(qEvent: OpeningAddedEventFieldsFragment, i: number): void {
    assert.equal(qEvent.group.name, this.group)
    assert.equal(qEvent.opening.runtimeId, this.events[i].event.data[0].toNumber())
  }

  async runQueryNodeChecks(): Promise<void> {
    await super.runQueryNodeChecks()
    // Query the events
    // const qEvents = await this.query.tryQueryWithTimeout(
    //   () => this.query.getOpeningAddedEvents(this.events),
    //   (qEvents) => this.assertQueryNodeEventsAreValid(qEvents)
    // )

    // // Query the openings
    // const qOpenings = await this.query.getOpeningsByIds(
    //   this.events.map((e) => e.event.data[0]),
    //   this.group
    // )
    // this.assertQueriedOpeningsAreValid(qOpenings, qEvents)
  }

  protected getOpeningMetadata(params: OpeningParams): IOpeningMetadata | null {
    if (typeof params.metadata === 'string') {
      try {
        return Utils.metadataFromBytes(OpeningMetadata, createType('Bytes', params.metadata))
      } catch (e) {
        if (!params.expectMetadataFailure) {
          throw e
        }
        return null
      }
    }

    return params.metadata
  }
}
