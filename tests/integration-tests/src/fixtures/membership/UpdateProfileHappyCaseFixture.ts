import { Api } from '../../Api'
import { assert } from 'chai'
import { QueryNodeApi } from '../../QueryNodeApi'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { BaseQueryNodeFixture } from '../../Fixture'
import { MemberContext, EventDetails } from '../../types'
import { MembershipFieldsFragment, MemberProfileUpdatedEventFieldsFragment } from '../../graphql/generated/queries'
import { MembershipMetadata } from '@joystream/metadata-protobuf'
import { Utils } from '../../utils'

// TODO: Add partial update to make sure it works too
export class UpdateProfileHappyCaseFixture extends BaseQueryNodeFixture {
  private memberContext: MemberContext
  // Update data
  private newName = 'New name'
  private newHandle = 'New handle'
  private newAbout = 'New about'

  private event?: EventDetails
  private tx?: SubmittableExtrinsic<'promise'>

  public constructor(api: Api, query: QueryNodeApi, memberContext: MemberContext) {
    super(api, query)
    this.memberContext = memberContext
  }

  private assertProfileUpdateSuccesful(qMember: MembershipFieldsFragment | null) {
    if (!qMember) {
      throw new Error('Query node: Membership not found!')
    }
    const {
      handle,
      metadata: { name, about },
    } = qMember
    assert.equal(name, this.newName)
    assert.equal(handle, this.newHandle)
    // TODO: avatar
    assert.equal(about, this.newAbout)
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
    assert.equal(inExtrinsic, txHash)
    assert.equal(memberId, this.memberContext.memberId.toString())
    assert.equal(newHandle, this.newHandle)
    assert.equal(newMetadata.name, this.newName)
    assert.equal(newMetadata.about, this.newAbout)
    // TODO: avatar
  }

  async execute(): Promise<void> {
    const metadata = new MembershipMetadata({
      name: this.newName,
      about: this.newAbout,
    })
    // TODO: avatar
    this.tx = this.api.tx.members.updateProfile(
      this.memberContext.memberId,
      this.newHandle,
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
