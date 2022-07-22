import { createType } from '@joystream/types'
import { WorkerId, CuratorGroupId } from '@joystream/types/primitives'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { ISubmittableResult } from '@polkadot/types/types/'
import { assert } from 'chai'
import { Api } from '../../../Api'
import { StandardizedFixture } from '../../../Fixture'
import { VideoDeletedByModeratorEventFieldsFragment } from '../../../graphql/generated/queries'
import { QueryNodeApi } from '../../../QueryNodeApi'
import { EventDetails, EventType } from '../../../types'

type VideoDeletedByModeratorEventDetails = EventDetails<EventType<'content', 'VideoDeletedByModerator'>>

export type DeleteVideoAsModeratorParams = {
  asCurator: [CuratorGroupId, WorkerId]
  videoId: number
  numOfObjectsToDelete: number
  rationale: string
}

export class DeleteVideoAsModeratorFixture extends StandardizedFixture {
  protected deleteVideoAsModeratorParams: DeleteVideoAsModeratorParams[]

  public constructor(api: Api, query: QueryNodeApi, deleteVideoAsModeratorParams: DeleteVideoAsModeratorParams[]) {
    super(api, query)
    this.deleteVideoAsModeratorParams = deleteVideoAsModeratorParams
  }

  protected async getEventFromResult(result: ISubmittableResult): Promise<VideoDeletedByModeratorEventDetails> {
    return this.api.getEventDetails(result, 'content', 'VideoDeletedByModerator')
  }

  protected async getSignerAccountOrAccounts(): Promise<string[]> {
    return await Promise.all(
      this.deleteVideoAsModeratorParams.map(async ({ asCurator }) =>
        (await this.api.query.contentWorkingGroup.workerById(asCurator[1])).unwrap().roleAccountId.toString()
      )
    )
  }

  protected async getExtrinsics(): Promise<SubmittableExtrinsic<'promise'>[]> {
    return this.deleteVideoAsModeratorParams.map(({ asCurator, videoId, numOfObjectsToDelete, rationale }) =>
      this.api.tx.content.deleteVideoAsModerator(
        createType('PalletContentPermissionsContentActor', { Curator: asCurator }),
        videoId,
        numOfObjectsToDelete,
        rationale
      )
    )
  }

  protected assertQueryNodeEventIsValid(qEvent: VideoDeletedByModeratorEventFieldsFragment, i: number): void {
    const params = this.deleteVideoAsModeratorParams[i]
    assert.equal(qEvent.videoId, params.videoId)
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
