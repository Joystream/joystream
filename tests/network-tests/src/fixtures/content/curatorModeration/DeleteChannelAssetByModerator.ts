import { createType } from '@joystream/types'
import { CuratorGroupId, WorkerId } from '@joystream/types/primitives'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { ISubmittableResult } from '@polkadot/types/types/'
import { assert } from 'chai'
import { Api } from '../../../Api'
import { StandardizedFixture } from '../../../Fixture'
import { QueryNodeApi } from '../../../QueryNodeApi'
import { ChannelAssetsDeletedByModeratorEventFieldsFragment } from '../../../graphql/generated/queries'
import { EventDetails, EventType } from '../../../types'

type ChannelAssetsDeletedByModeratorEventDetails = EventDetails<EventType<'content', 'ChannelAssetsDeletedByModerator'>>

export type DeleteChannelAssetsAsModeratorParams = {
  asCurator: [CuratorGroupId, WorkerId]
  channelId: number
  assetsToRemove: number[]
  rationale: string
}

export class DeleteChannelAssetsAsModeratorFixture extends StandardizedFixture {
  protected deleteChannelAssetsAsModeratorParams: DeleteChannelAssetsAsModeratorParams[]

  public constructor(
    api: Api,
    query: QueryNodeApi,
    deleteVideoAssetsAsModeratorParams: DeleteChannelAssetsAsModeratorParams[]
  ) {
    super(api, query)
    this.deleteChannelAssetsAsModeratorParams = deleteVideoAssetsAsModeratorParams
  }

  protected async getEventFromResult(result: ISubmittableResult): Promise<ChannelAssetsDeletedByModeratorEventDetails> {
    return this.api.getEventDetails(result, 'content', 'ChannelAssetsDeletedByModerator')
  }

  protected async getSignerAccountOrAccounts(): Promise<string[]> {
    return await Promise.all(
      this.deleteChannelAssetsAsModeratorParams.map(async ({ asCurator }) =>
        (await this.api.query.contentWorkingGroup.workerById(asCurator[1])).unwrap().roleAccountId.toString()
      )
    )
  }

  protected async getExtrinsics(): Promise<SubmittableExtrinsic<'promise'>[]> {
    return Promise.all(
      this.deleteChannelAssetsAsModeratorParams.map(async ({ asCurator, channelId, assetsToRemove, rationale }) =>
        this.api.tx.content.deleteChannelAssetsAsModerator(
          createType('PalletContentPermissionsContentActor', { Curator: asCurator }),
          channelId,
          createType('BTreeSet<u64>', assetsToRemove),
          await this.api.storageBucketsNumWitness(channelId),
          rationale
        )
      )
    )
  }

  protected assertQueryNodeEventIsValid(qEvent: ChannelAssetsDeletedByModeratorEventFieldsFragment, i: number): void {
    const params = this.deleteChannelAssetsAsModeratorParams[i]
    assert.equal(qEvent.channelId, params.channelId)
    assert.equal(qEvent.rationale, params.rationale)
  }

  async runQueryNodeChecks(): Promise<void> {
    await super.runQueryNodeChecks()
    // Query the events
    await this.query.tryQueryWithTimeout(
      () => this.query.getChannelAssetsDeletedByModeratorEvents(this.events),
      (qEvents) => this.assertQueryNodeEventsAreValid(qEvents)
    )
  }
}
