import { assert } from 'chai'
import { Api } from '../../Api'
import { QueryNodeApi } from '../../QueryNodeApi'
import { EventDetails, WorkingGroupModuleName } from '../../types'
import { BaseWorkingGroupFixture } from './BaseWorkingGroupFixture'
import { ApplicationId } from '@joystream/types/working-group'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { ISubmittableResult } from '@polkadot/types/types/'
import { Utils } from '../../utils'
import { ApplicationFieldsFragment, ApplicationWithdrawnEventFieldsFragment } from '../../graphql/generated/queries'

export class WithdrawApplicationsFixture extends BaseWorkingGroupFixture {
  protected applicationIds: ApplicationId[]
  protected accounts: string[]

  public constructor(
    api: Api,
    query: QueryNodeApi,
    group: WorkingGroupModuleName,
    accounts: string[],
    applicationIds: ApplicationId[]
  ) {
    super(api, query, group)
    this.accounts = accounts
    this.applicationIds = applicationIds
  }

  protected async getSignerAccountOrAccounts(): Promise<string[]> {
    return this.accounts
  }

  protected async getExtrinsics(): Promise<SubmittableExtrinsic<'promise'>[]> {
    return this.applicationIds.map((id) => this.api.tx[this.group].withdrawApplication(id))
  }

  protected async getEventFromResult(result: ISubmittableResult): Promise<EventDetails> {
    return this.api.retrieveWorkingGroupsEventDetails(result, this.group, 'ApplicationWithdrawn')
  }

  protected assertQueryNodeEventIsValid(qEvent: ApplicationWithdrawnEventFieldsFragment, i: number): void {
    assert.equal(qEvent.application.runtimeId, this.applicationIds[i].toNumber())
    assert.equal(qEvent.group.name, this.group)
  }

  protected assertApplicationStatusesAreValid(
    qEvents: ApplicationWithdrawnEventFieldsFragment[],
    qApplications: ApplicationFieldsFragment[]
  ): void {
    this.events.map((e, i) => {
      const qEvent = this.findMatchingQueryNodeEvent(e, qEvents)
      const qApplication = qApplications.find((a) => a.runtimeId === this.applicationIds[i].toNumber())
      Utils.assert(qApplication, 'Query node: Application not found!')
      Utils.assert(
        qApplication.status.__typename === 'ApplicationStatusWithdrawn',
        'Query node: Invalid application status!'
      )
      Utils.assert(
        qApplication.status.applicationWithdrawnEvent,
        'Query node: Missing applicationWithdrawnEvent relation'
      )
      assert.equal(qApplication.status.applicationWithdrawnEvent.id, qEvent.id)
    })
  }

  async runQueryNodeChecks(): Promise<void> {
    await super.runQueryNodeChecks()

    // Query the evens
    const qEvents = await this.query.tryQueryWithTimeout(
      () => this.query.getApplicationWithdrawnEvents(this.events),
      (qEvents) => this.assertQueryNodeEventsAreValid(qEvents)
    )

    // Check application statuses
    const qApplciations = await this.query.getApplicationsByIds(this.applicationIds, this.group)
    this.assertApplicationStatusesAreValid(qEvents, qApplciations)
  }
}
