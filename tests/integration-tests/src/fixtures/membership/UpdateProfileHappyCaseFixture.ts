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

export type MemberProfileData = {
  name?: string | null
  handle?: string | null
  about?: string | null
}

export class UpdateProfileHappyCaseFixture extends BaseQueryNodeFixture {
  private memberContext: MemberContext
  // Update data
  private newValues: MemberProfileData
  private oldValues: MemberProfileData

  private event?: EventDetails
  private tx?: SubmittableExtrinsic<'promise'>

  public constructor(
    api: Api,
    query: QueryNodeApi,
    memberContext: MemberContext,
    oldValues: MemberProfileData,
    newValues: MemberProfileData
  ) {
    super(api, query)
    this.memberContext = memberContext
    this.oldValues = oldValues
    this.newValues = newValues
    console.log({ oldValues, newValues })
  }

  private assertProfileUpdateSuccesful(qMember: MembershipFieldsFragment | null) {
    if (!qMember) {
      throw new Error('Query node: Membership not found!')
    }
    const { handle, metadata } = qMember
    const expected = this.getExpectedValues()
    assert.equal(metadata.name, expected.name)
    assert.equal(handle, expected.handle)
    // TODO: avatar
    assert.equal(metadata.about, expected.about)
  }

  public getExpectedValues(): MemberProfileData {
    return {
      handle: isSet(this.newValues.handle) ? this.newValues.handle : this.oldValues.handle,
      name: isSet(this.newValues.name) ? this.newValues.name || null : this.oldValues.name,
      about: isSet(this.newValues.about) ? this.newValues.about || null : this.oldValues.about,
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
      newHandle,
      newMetadata,
    } = qEvent
    const expected = this.getExpectedValues()
    assert.equal(inExtrinsic, txHash)
    assert.equal(memberId, this.memberContext.memberId.toString())
    assert.equal(newHandle, expected.handle)
    assert.equal(newMetadata.name, expected.name)
    assert.equal(newMetadata.about, expected.about)
    // TODO: avatar
  }

  async execute(): Promise<void> {
    const metadata = new MembershipMetadata({
      name: this.newValues.name,
      about: this.newValues.about,
    })
    // TODO: avatar
    this.tx = this.api.tx.members.updateProfile(
      this.memberContext.memberId,
      this.newValues.handle || null,
      Utils.metadataToBytes(MembershipMetadata, metadata)
    )
    const txFee = await this.api.estimateTxFee(this.tx, this.memberContext.account)
    await this.api.treasuryTransferBalance(this.memberContext.account, txFee)
    const txRes = await this.api.signAndSend(this.tx, this.memberContext.account)
    this.event = await this.api.retrieveMembershipEventDetails(txRes, 'MemberProfileUpdated')
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
