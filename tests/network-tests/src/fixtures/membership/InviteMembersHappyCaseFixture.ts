import { Api } from '../../Api'
import { assert } from 'chai'
import { QueryNodeApi } from '../../QueryNodeApi'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { EventDetails, EventType, MemberContext } from '../../types'
import { MemberInvitedEventFieldsFragment, MembershipFieldsFragment } from '../../graphql/generated/queries'
import { MemberId } from '@joystream/types/primitives'
import { MembershipMetadata } from '@joystream/metadata-protobuf'
import { Utils } from '../../utils'
import { StandardizedFixture } from '../../Fixture'
import { asMembershipExternalResource, generateParamsFromAccountId } from './utils'
import { SubmittableResult } from '@polkadot/api'
import BN from 'bn.js'

type MemberInvitedEventDetails = EventDetails<EventType<'members', 'MemberInvited'>>

export class InviteMembersHappyCaseFixture extends StandardizedFixture {
  protected inviterContext: MemberContext
  protected accounts: string[]
  protected initialInvitesCount?: number
  protected initialInvitationBalance?: BN
  protected expectedWGBudget?: BN
  protected events: MemberInvitedEventDetails[] = []

  public constructor(api: Api, query: QueryNodeApi, inviterContext: MemberContext, accounts: string[]) {
    super(api, query)
    this.inviterContext = inviterContext
    this.accounts = accounts
  }

  generateInviteMemberTx(memberId: MemberId, inviteeAccountId: string): SubmittableExtrinsic<'promise'> {
    return this.api.tx.members.inviteMember({
      ...generateParamsFromAccountId(inviteeAccountId),
      invitingMemberId: memberId,
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
        metadata: { name, about, avatar, externalResources },
        isVerified,
        entry,
        invitedBy,
        inviteCount,
      } = qMember
      const metadata = Utils.metadataFromBytes(MembershipMetadata, txParams.metadata)
      assert.equal(handle, txParams.handle)
      assert.equal(rootAccount, txParams.root_account)
      assert.equal(controllerAccount, txParams.controller_account)
      assert.equal(name, metadata.name)
      assert.equal(about, metadata.about)
      assert.equal(inviteCount, 0)
      assert.equal(avatar?.avatarUri, metadata.avatarUri || undefined)
      assert.includeDeepMembers(
        externalResources ?? [],
        metadata.externalResources?.map(asMembershipExternalResource) ?? []
      )
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
    assert.equal(qEvent.metadata.avatar?.avatarUri, metadata.avatarUri || undefined)
    Utils.assert(this.initialInvitationBalance, 'Initial invitation balance not set')
    assert.equal(qEvent.initialBalance.toString(), this.initialInvitationBalance.toString())
    assert.includeDeepMembers(
      qEvent.metadata.externalResources ?? [],
      metadata.externalResources?.map(asMembershipExternalResource) ?? []
    )
  }

  async execute(): Promise<void> {
    // Membership WG balance MUST be already set up to support addition of new members
    // Load initial invites count
    this.initialInvitesCount = (await this.api.query.members.membershipById(this.inviterContext.memberId))
      .unwrap()
      .invites.toNumber()
    // Load initial invitation balance
    this.initialInvitationBalance = await this.api.query.members.initialInvitationBalance()
    const initialWgBudget = await this.api.query.membershipWorkingGroup.budget()
    const requiredBudget = this.initialInvitationBalance.muln(this.accounts.length)
    // Execute
    await super.execute()
    // Verify WG budget
    const postExecutionWgBudget = await this.api.query.membershipWorkingGroup.budget()
    this.expectedWGBudget = initialWgBudget.sub(requiredBudget)
    assert.equal(postExecutionWgBudget.toString(), this.expectedWGBudget.toString())
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
    Utils.assert(this.initialInvitesCount, 'Initial invites count not set')
    assert.equal(inviteCount, this.initialInvitesCount - this.accounts.length)
    // Assert that all invited members are part of "invitees" field
    assert.isNotEmpty(invitees)
    assert.includeMembers(
      invitees.map(({ id }) => id),
      invitedMembersIds.map((id) => id.toString())
    )
    // Verify WG budget in the QN
    const membershipWg = await this.query.getWorkingGroup('membershipWorkingGroup')
    Utils.assert(membershipWg, 'QN: membershipWorkingGroup not found')
    Utils.assert(this.expectedWGBudget, 'Expected WG budget not set')
    assert.equal(membershipWg.budget.toString(), this.expectedWGBudget.toString())
  }
}
