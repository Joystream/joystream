import { Api } from '../../Api'
import { assert } from 'chai'
import { QueryNodeApi } from '../../QueryNodeApi'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { StandardizedFixture } from '../../Fixture'
import { EventDetails } from '../../types'
import {
  MembershipFieldsFragment,
  MemberVerificationStatusUpdatedEventFieldsFragment,
} from '../../graphql/generated/queries'
import { WorkerId, Worker } from '@joystream/types/working-group'
import { ISubmittableResult } from '@polkadot/types/types'
import { MemberId } from '@joystream/types/common'

export type UpdateVerificationStatusDetails = {
  memberId: MemberId
  isVerified: boolean
}

export class UpdateVerificationStatusFixture extends StandardizedFixture {
  private updates: UpdateVerificationStatusDetails[]
  private membershipWgLead!: [WorkerId, Worker]

  public constructor(api: Api, query: QueryNodeApi, updates: UpdateVerificationStatusDetails[]) {
    super(api, query)
    this.updates = updates
  }

  private async loadMembershipLead(): Promise<void> {
    this.membershipWgLead = await this.api.getLeader('membershipWorkingGroup')
  }

  protected async getExtrinsics(): Promise<SubmittableExtrinsic<'promise'>[]> {
    return this.updates.map((u) =>
      this.api.tx.members.updateProfileVerification(this.membershipWgLead[0], u.memberId, u.isVerified)
    )
  }

  protected async getSignerAccountOrAccounts(): Promise<string> {
    return this.membershipWgLead[1].role_account_id.toString()
  }

  protected assertQueryNodeEventIsValid(qEvent: MemberVerificationStatusUpdatedEventFieldsFragment, i: number): void {
    const update = this.updates[i]
    assert.equal(qEvent.isVerified, update.isVerified)
    assert.equal(qEvent.worker.id, `membershipWorkingGroup-${this.membershipWgLead[0].toString()}`)
  }

  protected async getEventFromResult(result: ISubmittableResult): Promise<EventDetails> {
    return this.api.getEventDetails(result, 'members', 'MemberVerificationStatusUpdated')
  }

  private assertStatusUpdateSuccesful(qMembers: MembershipFieldsFragment[]) {
    this.updates.forEach(({ memberId, isVerified }) => {
      const qMember = qMembers.find((m) => m.id === memberId.toString())
      if (!qMember) {
        throw new Error('Query node: Membership not found!')
      }
      assert.equal(qMember.isVerified, isVerified)
    })
  }

  async execute(): Promise<void> {
    await this.loadMembershipLead()
    await super.execute()
  }

  async runQueryNodeChecks(): Promise<void> {
    await super.runQueryNodeChecks()
    await this.query.tryQueryWithTimeout(
      () => this.query.getMembersByIds(this.updates.map((u) => u.memberId)),
      (qMembers) => this.assertStatusUpdateSuccesful(qMembers)
    )
    const qEvents = await this.query.getMembershipVerificationStatusUpdatedEvents(this.events)
    await this.assertQueryNodeEventsAreValid(qEvents)
  }
}
