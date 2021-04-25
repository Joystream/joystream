import { assert } from 'chai'
import { Api } from '../../Api'
import { QueryNodeApi } from '../../QueryNodeApi'
import { EventDetails, WorkingGroupModuleName } from '../../types'
import { BaseWorkingGroupFixture } from './BaseWorkingGroupFixture'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { ISubmittableResult } from '@polkadot/types/types/'
import { Utils } from '../../utils'
import { EventType } from '../../graphql/generated/schema'
import { SetGroupMetadata, WorkingGroupMetadata, WorkingGroupMetadataAction } from '@joystream/metadata-protobuf'
import {
  StatusTextChangedEventFieldsFragment,
  WorkingGroupFieldsFragment,
  WorkingGroupMetadataFieldsFragment,
} from '../../graphql/generated/queries'
import _ from 'lodash'

export class UpdateGroupStatusFixture extends BaseWorkingGroupFixture {
  protected updates: WorkingGroupMetadata.AsObject[]
  protected areExtrinsicsOrderSensitive = true

  public constructor(
    api: Api,
    query: QueryNodeApi,
    group: WorkingGroupModuleName,
    updates: WorkingGroupMetadata.AsObject[]
  ) {
    super(api, query, group)
    this.updates = updates
  }

  protected async getSignerAccountOrAccounts(): Promise<string> {
    return this.api.getLeadRoleKey(this.group)
  }

  protected async getExtrinsics(): Promise<SubmittableExtrinsic<'promise'>[]> {
    return this.updates.map((update) => {
      const metaBytes = Utils.metadataToBytes(this.getActionMetadata(update))
      return this.api.tx[this.group].setStatusText(metaBytes)
    })
  }

  protected async getEventFromResult(r: ISubmittableResult): Promise<EventDetails> {
    return this.api.retrieveWorkingGroupsEventDetails(r, this.group, 'StatusTextChanged')
  }

  protected getActionMetadata(update: WorkingGroupMetadata.AsObject): WorkingGroupMetadataAction {
    const actionMeta = new WorkingGroupMetadataAction()
    const setGroupMeta = new SetGroupMetadata()
    const newGroupMeta = new WorkingGroupMetadata()

    newGroupMeta.setAbout(update.about!)
    newGroupMeta.setDescription(update.description!)
    newGroupMeta.setStatus(update.status!)
    newGroupMeta.setStatusMessage(update.statusMessage!)

    setGroupMeta.setNewMetadata(newGroupMeta)
    actionMeta.setSetGroupMetadata(setGroupMeta)

    return actionMeta
  }

  protected assertQueryNodeEventIsValid(qEvent: StatusTextChangedEventFieldsFragment, i: number): void {
    assert.equal(qEvent.event.type, EventType.StatusTextChanged)
    assert.equal(qEvent.group.name, this.group)
    assert.equal(qEvent.metadata, Utils.metadataToBytes(this.getActionMetadata(this.updates[i])).toString())
    assert.equal(qEvent.result.__typename, 'WorkingGroupMetadataSet')
  }

  protected assertQueriedGroupIsValid(
    qGroup: WorkingGroupFieldsFragment,
    qMeta: WorkingGroupMetadataFieldsFragment
  ): void {
    if (!qGroup.metadata) {
      throw new Error(`Query node: Group metadata is empty!`)
    }
    assert.equal(qGroup.metadata.id, qMeta.id)
  }

  protected assertQueriedMetadataSnapshotsAreValid(
    eventDetails: EventDetails,
    preUpdateSnapshot: WorkingGroupMetadataFieldsFragment | null,
    postUpdateSnapshot: WorkingGroupMetadataFieldsFragment | null,
    update: WorkingGroupMetadata.AsObject
  ): asserts postUpdateSnapshot is WorkingGroupMetadataFieldsFragment {
    if (!postUpdateSnapshot) {
      throw new Error('Query node: WorkingGroupMetadata snapshot not found!')
    }
    const expectedMeta = _.merge(preUpdateSnapshot, update)
    assert.equal(postUpdateSnapshot.status, expectedMeta.status)
    assert.equal(postUpdateSnapshot.statusMessage, expectedMeta.statusMessage)
    assert.equal(postUpdateSnapshot.description, expectedMeta.description)
    assert.equal(postUpdateSnapshot.about, expectedMeta.about)
    assert.equal(postUpdateSnapshot.setAtBlock.number, eventDetails.blockNumber)
  }

  async runQueryNodeChecks(): Promise<void> {
    await super.runQueryNodeChecks()
    // Query & check the event
    const qEvents = await this.query.tryQueryWithTimeout(
      () => this.query.getStatusTextChangedEvents(this.events),
      (qEvents) => this.assertQueryNodeEventsAreValid(qEvents)
    )

    // Query the group
    const qGroup = await this.query.getWorkingGroup(this.group)
    if (!qGroup) {
      throw new Error('Query node: Working group not found!')
    }

    // Query & check the metadata snapshots
    const snapshots = await this.query.getGroupMetaSnapshotsByTimeAsc(qGroup.id)
    let lastSnapshot: WorkingGroupMetadataFieldsFragment | null = null
    this.events.forEach((postUpdateEvent, i) => {
      const postUpdateSnapshotIndex = snapshots.findIndex(
        (s) =>
          s.setInEvent.event.id ===
          this.query.getQueryNodeEventId(postUpdateEvent.blockNumber, postUpdateEvent.indexInBlock)
      )
      const postUpdateSnapshot = postUpdateSnapshotIndex > -1 ? snapshots[postUpdateSnapshotIndex] : null
      const preUpdateSnapshot = postUpdateSnapshotIndex > 0 ? snapshots[postUpdateSnapshotIndex - 1] : null
      this.assertQueriedMetadataSnapshotsAreValid(
        postUpdateEvent,
        preUpdateSnapshot,
        postUpdateSnapshot,
        this.updates[i]
      )
      const qEvent = qEvents[i]
      Utils.assert(
        qEvent.result.__typename === 'WorkingGroupMetadataSet',
        'Invalid StatusTextChanged event result type'
      )
      assert(qEvent.result.metadataId, postUpdateSnapshot.id)
      lastSnapshot = postUpdateSnapshot
    })

    // Check the group
    if (lastSnapshot) {
      this.assertQueriedGroupIsValid(qGroup, lastSnapshot)
    }
  }
}
