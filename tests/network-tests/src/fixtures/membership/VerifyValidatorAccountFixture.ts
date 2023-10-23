import { assert } from 'chai'
import Long from 'long'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { ISubmittableResult } from '@polkadot/types/types/'
import { WorkerId, ForumPostId, MemberId } from '@joystream/types/primitives'
import { RemarkMetadataAction } from '@joystream/metadata-protobuf'
import { Api } from '../../Api'
import { QueryNodeApi } from '../../QueryNodeApi'
import { EventDetails } from '../../types'
import { Utils } from '../../utils'
import { BaseQueryNodeFixture } from '../../Fixture'
import { MembershipFieldsFragment } from 'src/graphql/generated/queries'
import { createType } from '@joystream/types'

export type ValidaotrAccountInput = {
  memberId: string
  isVerified: boolean
  asWorker?: string
}

export class VerifyValidatorProfileFixture extends BaseQueryNodeFixture {
  protected verifyValidator: ValidaotrAccountInput[]

  public constructor(api: Api, query: QueryNodeApi, verifyValidator: ValidaotrAccountInput[]) {
    super(api, query)
    this.verifyValidator = verifyValidator
  }

  protected async getEventFromResult(result: ISubmittableResult): Promise<EventDetails> {
    if (this.api.findEvent(result, 'operationsWorkingGroupBeta', 'WorkerRemarked')) {
      return this.api.getEventDetails(result, 'operationsWorkingGroupBeta', 'WorkerRemarked')
    } else {
      return this.api.getEventDetails(result, 'operationsWorkingGroupBeta', 'LeadRemarked')
    }
  }

  protected async getExtrinsics(): Promise<SubmittableExtrinsic<'promise'>[]> {
    return this.verifyValidator.map((u) => {
      const metadata = Utils.metadataToBytes(RemarkMetadataAction, {
        verifyValidator: { memberId: Long.fromString(String(u.memberId)), isVerified: u.isVerified },
      })
      return u.asWorker
        ? this.api.tx.operationsWorkingGroupBeta.workerRemark(u.asWorker, metadata)
        : this.api.tx.operationsWorkingGroupBeta.leadRemark(metadata)
    })
  }

  private VerifyValidatorTest(qMember: MembershipFieldsFragment[] | null): void {
    if (!qMember) {
      throw new Error('Query node: Membership not found!')
    }
    this.verifyValidator.map((d) => {
      const data = qMember.find((k) => k.id === d.memberId)?.metadata
      assert.equal(data?.isVerifiedValidator, d.isVerified)
    })
  }

  async execute(): Promise<void> {
    await super.runQueryNodeChecks()
    const qmember = await this.query.getMembersByIds(
      this.verifyValidator.map((m) => {
        return createType('u64', Number(m.memberId))
      })
    )
    this.VerifyValidatorTest(qmember)
  }
}
