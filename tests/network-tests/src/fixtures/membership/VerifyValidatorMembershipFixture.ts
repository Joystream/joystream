import { assert } from 'chai'
import Long from 'long'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { ISubmittableResult } from '@polkadot/types/types/'
import { WorkerId } from '@joystream/types/primitives'
import { RemarkMetadataAction } from '@joystream/metadata-protobuf'
import { createType } from '@joystream/types'
import { Api } from '../../Api'
import { QueryNodeApi } from '../../QueryNodeApi'
import { EventDetails } from '../../types'
import { Utils } from '../../utils'
import { MembershipFieldsFragment, ValididatorVerificationStatusUpdatedEventFieldsFragment } from '../../graphql/generated/queries'
import { WithMembershipWorkersFixture } from './WithMembershipWorkersFixture'

export type VerifyValidatorInput = {
  memberId: string
  isVerified: boolean
  asWorker?: WorkerId
  expectFailure?: boolean
}

export class VerifyValidatorMembershipFixture extends WithMembershipWorkersFixture {
  protected verifications: VerifyValidatorInput[]

  public constructor(api: Api, query: QueryNodeApi, verifications: VerifyValidatorInput[]) {
    super(api, query)
    this.verifications = verifications
  }

  protected async getSignerAccountOrAccounts(): Promise<string[]> {
    return this.getSignersFromInput(this.verifications)
  }

  protected async getExtrinsics(): Promise<SubmittableExtrinsic<'promise'>[]> {
    return this.verifications.map((u) => {
      const metadata = Utils.metadataToBytes(RemarkMetadataAction, {
        verifyValidator: { memberId: Long.fromString(u.memberId), isVerified: u.isVerified },
      })
      return u.memberId
        ? this.api.tx.membershipWorkingGroup.workerRemark(u.memberId, metadata)
        : this.api.tx.membershipWorkingGroup.leadRemark(metadata)
    })
  }

  protected async getEventFromResult(result: ISubmittableResult): Promise<EventDetails> {
    if (this.api.findEvent(result, 'membershipWorkingGroup', 'WorkerRemarked')) {
      return this.api.getEventDetails(result, 'membershipWorkingGroup', 'WorkerRemarked')
    } else {
      return this.api.getEventDetails(result, 'membershipWorkingGroup', 'LeadRemarked')
    }
  }

  private assertQueriedMembershipsAreValid(
    qMembers: MembershipFieldsFragment[],
    qEvents: ValididatorVerificationStatusUpdatedEventFieldsFragment[]
  ): void {
    const verifiedSuccessfully = this.verifications.filter((m) => !m.expectFailure).length
    assert.equal(qEvents.length, verifiedSuccessfully, 'Too many validator memberships were verified')

    this.events.map((e, i) => {
      const verification = this.verifications[i]
      if (verification.expectFailure) return

      const qMembership = qMembers.find((p) => p.id === verification.memberId)
      Utils.assert(qMembership, 'Query node: Membership not found')
    })
  }

  protected assertQueryNodeEventIsValid(qEvent: ValididatorVerificationStatusUpdatedEventFieldsFragment, i: number): void {
    const { memberId, isVerified, asWorker } = this.verifications[i]
    assert.equal(qEvent.member.id, memberId)
    assert.equal(qEvent.actor.id, `membershipWorkingGroup-${asWorker ? asWorker.toString() : this.membershipLeadId!.toString()}`)
    assert.equal(qEvent.metadata.is_verified, isVerified)
  }
  async runQueryNodeChecks(): Promise<void> {
    await super.runQueryNodeChecks()

    const expectFailureAtIndexes = this.verifications.flatMap((m, i) => (m.expectFailure ? [i] : []))
    const qEvents = await this.query.tryQueryWithTimeout(
      () => this.query.getValidatorVerificationStatusUpdatedEvents(this.events),
      (qEvents) => this.assertQueryNodeEventsAreValid(qEvents, expectFailureAtIndexes)
    )

    const qMembers = await this.query.getMembersByIds(this.verifications.map((m) => m.memberId))
    this.assertQueriedMembershipsAreValid(qMembers, qEvents)
  }
}
