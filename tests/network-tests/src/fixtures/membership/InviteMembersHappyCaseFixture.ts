import { Api } from '../../Api'
import { assert } from 'chai'
import { QueryNodeApi } from '../../QueryNodeApi'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { EventDetails, EventType, MemberContext } from '../../types'
import { MemberInvitedEventFieldsFragment, MembershipFieldsFragment } from '../../graphql/generated/queries'
import { MemberId } from '@joystream/types/common'
import { MembershipMetadata } from '@joystream/metadata-protobuf'
import { Utils } from '../../utils'
import { StandardizedFixture } from '../../Fixture'
import { generateParamsFromAccountId } from './utils'
import { SubmittableResult } from '@polkadot/api'

type MemberInvitedEventDetails = EventDetails<EventType<'members', 'MemberInvited'>>

export class InviteMembersHappyCaseFixture extends StandardizedFixture {
  protected inviterContext: MemberContext
  protected accounts: string[]
  protected initialInvitesCount?: number
  protected events: MemberInvitedEventDetails[] = []

  public constructor(api: Api, query: QueryNodeApi, inviterContext: MemberContext, accounts: string[]) {
    super(api, query)
    this.inviterContext = inviterContext
    this.accounts = accounts
  }

  generateInviteMemberTx(memberId: MemberId, inviteeAccountId: string): SubmittableExtrinsic<'promise'> {
    return this.api.tx.members.inviteMember({
      ...generateParamsFromAccountId(inviteeAccountId),
      inviting_member_id: memberId,
    })
  }

  protected async getSignerAccountOrAccounts(): Promise<string> {
    return this.inviterContext.account
  }

  protected async getExtrinsics(): Promise<SubmittableExtrinsic<'promise'>[]> {
    return this.accounts.map((a) => this.generateInviteMemberTx(this.inviterContext.memberId, a))
  }

  protected async getEventFromResult(result: SubmittableResult): Promise<MemberInvitedEventDetails> {
    return this.api.getEventDetails(result, 'members', 'MemberInvited')
  }

  protected assertQueriedInvitedMembersAreValid(
    qMembers: MembershipFieldsFragment[],
    qEvents: MemberInvitedEventFieldsFragment[]
  ): void {
    this.events.map((e, i) => {
      const account = this.accounts[i]
      const txParams = generateParamsFromAccountId(account)
      const qMember = qMembers.find((m) => m.id === e.event.data[0].toString())
      const qEvent = this.findMatchingQueryNodeEvent(e, qEvents)
      Utils.assert(qMember, 'Query node: Membership not found!')
      const {
        handle,
        rootAccount,
        controllerAccount,
        metadata: { name, about },
        isVerified,
        entry,
        invitedBy,
      } = qMember
      const metadata = Utils.metadataFromBytes(MembershipMetadata, txParams.metadata)
      assert.equal(handle, txParams.handle)
      assert.equal(rootAccount, txParams.root_account)
      assert.equal(controllerAccount, txParams.controller_account)
      assert.equal(name, metadata.name)
      assert.equal(about, metadata.about)
      // TODO: avatar
      assert.equal(isVerified, false)
      Utils.assert(entry.__typename === 'MembershipEntryInvited', 'Query node: Invalid member entry method')
      Utils.assert(entry.memberInvitedEvent, 'Query node: Empty memberInvitedEvent reference')
      assert.equal(entry.memberInvitedEvent.id, qEvent.id)
      Utils.assert(invitedBy, 'invitedBy cannot be empty')
      assert.equal(invitedBy.id, this.inviterContext.memberId.toString())
    })
  }

  protected assertQueryNodeEventIsValid(qEvent: MemberInvitedEventFieldsFragment, i: number): void {
    const account = this.accounts[i]
    const eventDetails = this.events[i]
    const txParams = generateParamsFromAccountId(account)
    const metadata = Utils.metadataFromBytes(MembershipMetadata, txParams.metadata)
    assert.equal(qEvent.newMember.id, eventDetails.event.data[0].toString())
    assert.equal(qEvent.handle, txParams.handle)
    assert.equal(qEvent.rootAccount, txParams.root_account)
    assert.equal(qEvent.controllerAccount, txParams.controller_account)
    assert.equal(qEvent.metadata.name, metadata.name)
    assert.equal(qEvent.metadata.about, metadata.about)
    // TODO: avatar
  }

  async execute(): Promise<void> {
    const initialInvitationBalance = await this.api.query.members.initialInvitationBalance()
    // Top up working group budget to allow funding invited members
    await this.api.makeSudoCall(
      this.api.tx.membershipWorkingGroup.setBudget(initialInvitationBalance.muln(this.accounts.length))
    )
    // Load initial invites count
    this.initialInvitesCount = (
      await this.api.query.members.membershipById(this.inviterContext.memberId)
    ).invites.toNumber()
    // Execute
    await super.execute()
  }

  async runQueryNodeChecks(): Promise<void> {
    await super.runQueryNodeChecks()

    const qEvents = await this.query.tryQueryWithTimeout(
      () => this.query.getMemberInvitedEvents(this.events),
      (res) => this.assertQueryNodeEventsAreValid(res)
    )

    const invitedMembersIds = this.events.map((e) => e.event.data[0])
    const qInvitedMembers = await this.query.getMembersByIds(invitedMembersIds)
    this.assertQueriedInvitedMembersAreValid(qInvitedMembers, qEvents)

    const qInviter = await this.query.getMemberById(this.inviterContext.memberId)
    Utils.assert(qInviter, 'Query node: Inviter member not found!')

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
