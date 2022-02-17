import { Api } from '../../Api'
import { assert } from 'chai'
import { QueryNodeApi } from '../../QueryNodeApi'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { BaseQueryNodeFixture } from '../../Fixture'
import { MemberContext, EventDetails } from '../../types'
import { InvitesTransferredEventFieldsFragment } from '../../graphql/generated/queries'
import { Membership } from '@joystream/types/members'

export class TransferInvitesHappyCaseFixture extends BaseQueryNodeFixture {
  private fromContext: MemberContext
  private toContext: MemberContext
  private invitesToTransfer: number

  private fromMemberInitialInvites?: number
  private toMemberInitialInvites?: number
  private event?: EventDetails
  private tx?: SubmittableExtrinsic<'promise'>

  public constructor(
    api: Api,
    query: QueryNodeApi,
    fromContext: MemberContext,
    toContext: MemberContext,
    invitesToTransfer = 2
  ) {
    super(api, query)
    this.fromContext = fromContext
    this.toContext = toContext
    this.invitesToTransfer = invitesToTransfer
  }

  private assertQueryNodeEventIsValid(
    eventDetails: EventDetails,
    txHash: string,
    qEvent: InvitesTransferredEventFieldsFragment | null
  ) {
    if (!qEvent) {
      throw new Error('Query node: InvitesTransferredEvent not found!')
    }
    const { inExtrinsic, sourceMember, targetMember, numberOfInvites } = qEvent
    assert.equal(inExtrinsic, txHash)
    assert.equal(sourceMember.id, this.fromContext.memberId.toString())
    assert.equal(targetMember.id, this.toContext.memberId.toString())
    assert.equal(numberOfInvites, this.invitesToTransfer)
  }

  async execute(): Promise<void> {
    const { fromContext, toContext, invitesToTransfer } = this
    this.tx = this.api.tx.members.transferInvites(fromContext.memberId, toContext.memberId, invitesToTransfer)
    const txFee = await this.api.estimateTxFee(this.tx, fromContext.account)
    await this.api.treasuryTransferBalance(fromContext.account, txFee)

    const [fromMember, toMember] = await this.api.query.members.membershipById.multi<Membership>([
      fromContext.memberId,
      toContext.memberId,
    ])

    this.fromMemberInitialInvites = fromMember.invites.toNumber()
    this.toMemberInitialInvites = toMember.invites.toNumber()

    // Send transfer invites extrinsic
    const txRes = await this.api.signAndSend(this.tx, fromContext.account)
    this.event = await this.api.getEventDetails(txRes, 'members', 'InvitesTransferred')
  }

  async runQueryNodeChecks(): Promise<void> {
    await super.runQueryNodeChecks()
    const { fromContext, toContext, invitesToTransfer } = this
    // Check "from" member
    await this.query.tryQueryWithTimeout(
      () => this.query.getMemberById(fromContext.memberId),
      (qSourceMember) => {
        if (!qSourceMember) {
          throw new Error('Query node: Source member not found')
        }
        assert.equal(qSourceMember.inviteCount, this.fromMemberInitialInvites! - invitesToTransfer)
      }
    )

    // Check "to" member
    const qTargetMember = await this.query.getMemberById(toContext.memberId)
    if (!qTargetMember) {
      throw new Error('Query node: Target member not found')
    }
    assert.equal(qTargetMember.inviteCount, this.toMemberInitialInvites! + invitesToTransfer)

    // Check event
    const qEvent = await this.query.getInvitesTransferredEvent(fromContext.memberId)

    this.assertQueryNodeEventIsValid(this.event!, this.tx!.hash.toString(), qEvent)
  }
}
