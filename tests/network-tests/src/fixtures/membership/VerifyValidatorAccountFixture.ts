import { assert } from 'chai'
import Long from 'long'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { ISubmittableResult } from '@polkadot/types/types/'
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
  isVerifiedValidator: boolean
}

export class VerifyValidatorProfileFixture extends BaseQueryNodeFixture {
  protected verifyValidator: ValidaotrAccountInput[]

  public constructor(api: Api, query: QueryNodeApi, verifyValidator: ValidaotrAccountInput[]) {
    super(api, query)
    this.verifyValidator = verifyValidator
  }

  protected async getEventFromResult(result: ISubmittableResult): Promise<EventDetails> {
    console.log('---------------- start ------------------------------------')
    if (this.api.findEvent(result, 'membershipWorkingGroup', 'WorkerRemarked')) {
      return this.api.getEventDetails(result, 'membershipWorkingGroup', 'WorkerRemarked')
    } else {
      return this.api.getEventDetails(result, 'membershipWorkingGroup', 'LeadRemarked')
    }
  }

  protected async getExtrinsics(): Promise<SubmittableExtrinsic<'promise'>[]> {
    return this.verifyValidator.map((u) => {
      const metadata = Utils.metadataToBytes(RemarkMetadataAction, {
        verifyValidator: { memberId: Long.fromString(String(u.memberId)), isVerified: u.isVerifiedValidator },
      })
      return u.memberId
        ? this.api.tx.membershipWorkingGroup.workerRemark(u.memberId, metadata)
        : this.api.tx.membershipWorkingGroup.leadRemark(metadata)
    })
  }

  private assetVerifyValidatorTest(qMember: MembershipFieldsFragment[] | null): void {
    if (!qMember) {
      throw new Error('Query node: Membership not found!')
    }
    this.verifyValidator.map((d) => {
      const data = qMember.find((k) => k.id === d.memberId)?.metadata
      console.log(data, d)
      assert.equal(data?.isVerifiedValidator, d.isVerifiedValidator)
    })
  }

  async execute(): Promise<void> {
    this.verifyValidator.map((u) => {
      const metadata = Utils.metadataToBytes(RemarkMetadataAction, {
        verifyValidator: { memberId: Long.fromString(String(u.memberId)), isVerified: u.isVerifiedValidator },
      })

      console.log(u.isVerifiedValidator, u.memberId)
      u.memberId
        ? this.api.tx.membershipWorkingGroup.workerRemark(u.memberId, metadata)
        : this.api.tx.membershipWorkingGroup.leadRemark(metadata)
    })
  }

  async runQueryNodeChecks(): Promise<void> {
    await super.runQueryNodeChecks()
    const qmember = await this.query.getMembersByIds(
      this.verifyValidator.map((m) => {
        return createType('u64', Number(m.memberId))
      })
    )
    this.assetVerifyValidatorTest(qmember)
  }
}
