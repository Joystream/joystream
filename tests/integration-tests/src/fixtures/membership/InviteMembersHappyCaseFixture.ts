import { Api } from '../../Api'
import { assert } from 'chai'
import { QueryNodeApi } from '../../QueryNodeApi'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { BaseMembershipFixture } from './BaseMembershipFixture'
import { MemberContext, MemberInvitedEventDetails } from '../../types'
import { MemberInvitedEventFieldsFragment, MembershipFieldsFragment } from '../../graphql/generated/queries'
import { EventType, MembershipEntryMethod } from '../../graphql/generated/schema'
import { MemberId } from '@joystream/types/common'
import { MembershipMetadata } from '@joystream/metadata-protobuf'

export class InviteMembersHappyCaseFixture extends BaseMembershipFixture {
  private inviterContext: MemberContext
  private accounts: string[]

  private initialInvitesCount?: number
  private extrinsics: SubmittableExtrinsic<'promise'>[] = []
  private events: MemberInvitedEventDetails[] = []

  public constructor(api: Api, query: QueryNodeApi, inviterContext: MemberContext, accounts: string[]) {
    super(api, query)
    this.inviterContext = inviterContext
    this.accounts = accounts
  }

  generateInviteMemberTx(memberId: MemberId, inviteeAccountId: string): SubmittableExtrinsic<'promise'> {
    return this.api.tx.members.inviteMember({
      ...this.generateParamsFromAccountId(inviteeAccountId),
      inviting_member_id: memberId,
    })
  }

  private assertMemberCorrectlyInvited(account: string, qMember: MembershipFieldsFragment | null) {
    if (!qMember) {
      throw new Error('Query node: Membership not found!')
    }
    const {
      handle,
      rootAccount,
      controllerAccount,
      metadata: { name, about },
      isVerified,
      entry,
      invitedBy,
    } = qMember
    const txParams = this.generateParamsFromAccountId(account)
    const metadata = MembershipMetadata.deserializeBinary(txParams.metadata.toU8a(true))
    assert.equal(handle, txParams.handle)
    assert.equal(rootAccount, txParams.root_account)
    assert.equal(controllerAccount, txParams.controller_account)
    assert.equal(name, metadata.getName())
    assert.equal(about, metadata.getAbout())
    // TODO: avatar
    assert.equal(isVerified, false)
    assert.equal(entry, MembershipEntryMethod.Invited)
    assert.isOk(invitedBy)
    assert.equal(invitedBy!.id, this.inviterContext.memberId.toString())
  }

  private aseertQueryNodeEventIsValid(
    eventDetails: MemberInvitedEventDetails,
    account: string,
    txHash: string,
    qEvent: MemberInvitedEventFieldsFragment | null
  ) {
    if (!qEvent) {
      throw new Error('Query node: MemberInvitedEvent not found!')
    }
    const txParams = this.generateParamsFromAccountId(account)
    const metadata = MembershipMetadata.deserializeBinary(txParams.metadata.toU8a(true))
    assert.equal(qEvent.event.inBlock.number, eventDetails.blockNumber)
    assert.equal(qEvent.event.inExtrinsic, txHash)
    assert.equal(qEvent.event.indexInBlock, eventDetails.indexInBlock)
    assert.equal(qEvent.event.type, EventType.MemberInvited)
    assert.equal(qEvent.newMember.id, eventDetails.newMemberId.toString())
    assert.equal(qEvent.handle, txParams.handle)
    assert.equal(qEvent.rootAccount, txParams.root_account)
    assert.equal(qEvent.controllerAccount, txParams.controller_account)
    assert.equal(qEvent.metadata.name, metadata.getName())
    assert.equal(qEvent.metadata.about, metadata.getAbout())
    // TODO: avatar
  }

  async execute(): Promise<void> {
    this.extrinsics = this.accounts.map((a) => this.generateInviteMemberTx(this.inviterContext.memberId, a))
    const feePerTx = await this.api.estimateTxFee(this.extrinsics[0], this.inviterContext.account)
    await this.api.treasuryTransferBalance(this.inviterContext.account, feePerTx.muln(this.accounts.length))

    const initialInvitationBalance = await this.api.query.members.initialInvitationBalance()
    // Top up working group budget to allow funding invited members
    await this.api.makeSudoCall(
      this.api.tx.membershipWorkingGroup.setBudget(initialInvitationBalance.muln(this.accounts.length))
    )

    const { invites } = await this.api.query.members.membershipById(this.inviterContext.memberId)
    this.initialInvitesCount = invites.toNumber()

    const txResults = await Promise.all(
      this.extrinsics.map((tx) => this.api.signAndSend(tx, this.inviterContext.account))
    )
    this.events = await Promise.all(txResults.map((res) => this.api.retrieveMemberInvitedEventDetails(res)))
  }

  async runQueryNodeChecks(): Promise<void> {
    await super.runQueryNodeChecks()
    const invitedMembersIds = this.events.map((e) => e.newMemberId)
    await Promise.all(
      this.accounts.map(async (account, i) => {
        const memberId = invitedMembersIds[i]
        await this.query.tryQueryWithTimeout(
          () => this.query.getMemberById(memberId),
          (qMember) => this.assertMemberCorrectlyInvited(account, qMember)
        )
        const qEvent = await this.query.getMemberInvitedEvent(memberId)
        this.aseertQueryNodeEventIsValid(this.events[i], account, this.extrinsics[i].hash.toString(), qEvent)
      })
    )

    const qInviter = await this.query.getMemberById(this.inviterContext.memberId)
    if (!qInviter) {
      throw new Error('Query node: Inviter member not found!')
    }
    const { inviteCount, invitees } = qInviter
    // Assert that inviteCount was correctly updated
    assert.equal(inviteCount, this.initialInvitesCount! - this.accounts.length)
    // Assert that all invited members are part of "invetees" field
    assert.isNotEmpty(invitees)
    assert.includeMembers(
      invitees.map(({ id }) => id),
      invitedMembersIds.map((id) => id.toString())
    )
  }
}
