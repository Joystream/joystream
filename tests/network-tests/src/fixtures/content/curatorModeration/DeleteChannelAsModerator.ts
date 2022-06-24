import { createType } from '@joystream/types'
import { ContentActor, CuratorGroupId, VideoId } from '@joystream/types/content'
import { WorkerId } from '@joystream/types/working-group'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { ISubmittableResult } from '@polkadot/types/types/'
import { assert } from 'chai'
import { Api } from '../../../Api'
import { StandardizedFixture } from '../../../Fixture'
import { ChannelAssetsDeletedByModeratorEventFieldsFragment } from '../../../graphql/generated/queries'
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
        (await this.api.query.contentWorkingGroup.workerById(asCurator[1])).role_account_id.toString()
      )
    )
  }

  protected async getExtrinsics(): Promise<SubmittableExtrinsic<'promise'>[]> {
    return this.deleteChannelAsModeratorParams.map(({ asCurator, channelId, numOfObjectsToDelete, rationale }) =>
      this.api.tx.content.deleteVideoAsModerator(
        createType<ContentActor, 'ContentActor'>('ContentActor', { Curator: asCurator }),
        channelId,
        numOfObjectsToDelete,
        rationale
      )
    )
  }

  protected assertQueryNodeEventIsValid(qEvent: ChannelAssetsDeletedByModeratorEventFieldsFragment, i: number): void {
    const params = this.deleteChannelAsModeratorParams[i]
    assert.equal(qEvent.channel.id, params.channelId.toString())
    assert.equal(qEvent.rationale, params.rationale)
  }

  async runQueryNodeChecks(): Promise<void> {
    await super.runQueryNodeChecks()
    // Query the events
    await this.query.tryQueryWithTimeout(
      () => this.query.getVideoDeletedByModeratorEvents(this.events),
      (qEvents) => this.assertQueryNodeEventsAreValid(qEvents)
    )
  }
}
