import { Api } from '../../Api'
import { assert } from 'chai'
import { QueryNodeApi } from '../../QueryNodeApi'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { BaseQueryNodeFixture } from '../../Fixture'
import { MemberContext, EventDetails } from '../../types'
import { MembershipFieldsFragment, MemberProfileUpdatedEventFieldsFragment } from '../../graphql/generated/queries'
import { MembershipMetadata } from '@joystream/metadata-protobuf'
import { Utils } from '../../utils'
import { isSet } from '@joystream/metadata-protobuf/utils'

export type ValidatorAccountData = {
  validatorAccount?: string | null
}

export class VerifyValidatorAccountFixture extends BaseQueryNodeFixture {
  private memberContext: MemberContext
  // Update data
  private newValues: ValidatorAccountData
  private oldValues: ValidatorAccountData

  private event?: EventDetails
  private tx?: SubmittableExtrinsic<'promise'>

  public constructor(
    api: Api,
    query: QueryNodeApi,
    memberContext: MemberContext,
    oldValues: ValidatorAccountData,
    newValues: ValidatorAccountData
  ) {
    super(api, query)
    this.memberContext = memberContext
    this.oldValues = oldValues
    this.newValues = newValues
  }

  private assertProfileUpdateSuccesful(qMember: MembershipFieldsFragment | null) {
    if (!qMember) {
      throw new Error('Query node: Membership not found!')
    }
    const { metadata } = qMember
    const expected = this.getExpectedValues()

    assert.equal(metadata.isVerifiedValidator, false)
    assert.equal(metadata.validatorAccount, expected.validatorAccount)
  }

  public getExpectedValues(): ValidatorAccountData {
    return {
      validatorAccount: isSet(this.newValues.validatorAccount)
        ? this.newValues.validatorAccount || null
        : this.oldValues.validatorAccount,
    }
  }

  private assertQueryNodeEventIsValid(
    eventDetails: EventDetails,
    txHash: string,
    qEvents: MemberProfileUpdatedEventFieldsFragment[]
  ) {
    const qEvent = this.findMatchingQueryNodeEvent(eventDetails, qEvents)
    const {
      inExtrinsic,
      member: { id: memberId },
      newMetadata,
    } = qEvent
    assert.equal(inExtrinsic, txHash)
    assert.equal(memberId, this.memberContext.memberId.toString())
    assert.isFalse(Utils.hasDuplicates(newMetadata.externalResources?.map(({ type }) => type)))
  }

  async execute(): Promise<void> {
    const metadata = new MembershipMetadata({
      validatorAccount: this.newValues.validatorAccount,
    })
    // this.tx = this.api.tx.
    // this.tx = this.api.tx.members.(
    //   this.memberContext.memberId,
    //   this.newValues.handle || null,
    //   Utils.metadataToBytes(MembershipMetadata, metadata)
    // )
  }

  async runQueryNodeChecks(): Promise<void> {
    await super.runQueryNodeChecks()
    await this.query.tryQueryWithTimeout(
      () => this.query.getMemberById(this.memberContext.memberId),
      (qMember) => this.assertProfileUpdateSuccesful(qMember)
    )
    const qEvents = await this.query.getMemberProfileUpdatedEvents(this.memberContext.memberId)
    this.assertQueryNodeEventIsValid(this.event!, this.tx!.hash.toString(), qEvents)
  }
}
