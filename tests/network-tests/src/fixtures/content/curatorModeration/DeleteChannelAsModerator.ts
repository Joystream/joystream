import { createType } from '@joystream/types'
import { WorkerId, CuratorGroupId } from '@joystream/types/primitives'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { ISubmittableResult } from '@polkadot/types/types/'
import { assert } from 'chai'
import { ChannelDeletedByModeratorEventFieldsFragment } from 'src/graphql/generated/queries'
import { Api } from '../../../Api'
import { StandardizedFixture } from '../../../Fixture'
import { QueryNodeApi } from '../../../QueryNodeApi'
import { EventDetails, EventType } from '../../../types'

type ChannelDeletedByModeratorEventDetails = EventDetails<EventType<'content', 'ChannelDeletedByModerator'>>

export type DeleteChannelAsModeratorParams = {
  asCurator: [CuratorGroupId, WorkerId]
  channelId: number
  numOfObjectsToDelete: number
  rationale: string
}

export class DeleteChannelAsModeratorFixture extends StandardizedFixture {
  protected deleteChannelAsModeratorParams: DeleteChannelAsModeratorParams[]

  public constructor(api: Api, query: QueryNodeApi, deleteChannelAsModeratorParams: DeleteChannelAsModeratorParams[]) {
    super(api, query)
    this.deleteChannelAsModeratorParams = deleteChannelAsModeratorParams
  }

  protected async getEventFromResult(result: ISubmittableResult): Promise<ChannelDeletedByModeratorEventDetails> {
    return this.api.getEventDetails(result, 'content', 'ChannelDeletedByModerator')
  }

  protected async getSignerAccountOrAccounts(): Promise<string[]> {
    return await Promise.all(
      this.deleteChannelAsModeratorParams.map(async ({ asCurator }) =>
        (await this.api.query.contentWorkingGroup.workerById(asCurator[1])).unwrap().roleAccountId.toString()
      )
    )
  }

  protected async getExtrinsics(): Promise<SubmittableExtrinsic<'promise'>[]> {
    return Promise.all(
      this.deleteChannelAsModeratorParams.map(async ({ asCurator, channelId, numOfObjectsToDelete, rationale }) =>
        this.api.tx.content.deleteChannelAsModerator(
          createType('PalletContentPermissionsContentActor', { Curator: asCurator }),
          channelId,
          await this.api.channelBagWitness(channelId),
          numOfObjectsToDelete,
          rationale
        )
      )
    )
  }

  protected assertQueryNodeEventIsValid(qEvent: ChannelDeletedByModeratorEventFieldsFragment, i: number): void {
    const params = this.deleteChannelAsModeratorParams[i]
    assert.equal(qEvent.channelId, params.channelId)
    assert.equal(qEvent.rationale, params.rationale)
  }

  async runQueryNodeChecks(): Promise<void> {
    await super.runQueryNodeChecks()
    // Query the events
    await this.query.tryQueryWithTimeout(
      () => this.query.getChannelDeletedByModeratorEvents(this.events),
      (qEvents) => this.assertQueryNodeEventsAreValid(qEvents)
    )
  }
}
