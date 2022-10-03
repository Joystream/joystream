import { Api } from '../../Api'
import { assert } from 'chai'
import { asMembershipExternalResource, generateParamsFromAccountId } from './utils'
import { MemberId } from '@joystream/types/primitives'
import { QueryNodeApi } from '../../QueryNodeApi'
import { PalletMembershipMembershipObject as Membership } from '@polkadot/types/lookup'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { MembershipMetadata } from '@joystream/metadata-protobuf'
import { EventDetails, EventType } from '../../types'
import { MemberCreatedEventFieldsFragment, MembershipFieldsFragment } from '../../graphql/generated/queries'
import { Utils } from '../../utils'
import { StandardizedFixture } from '../../Fixture'
import { SubmittableResult } from '@polkadot/api'

type MemberCreatedEventDetails = EventDetails<EventType<'members', 'MemberCreated'>>

export class CreateMemberHappyCaseFixture extends StandardizedFixture {
  protected accounts: string[]
  protected memberIds: MemberId[] = []
  protected events: MemberCreatedEventDetails[] = []
  protected members: Membership[] = []
  protected defaultInviteCount!: number
  protected asFoundingMember: boolean

  public constructor(api: Api, query: QueryNodeApi, accounts: string[], asFoundingMember = false) {
    super(api, query)
    this.accounts = accounts
    this.asFoundingMember = asFoundingMember
  }

  protected async getSignerAccountOrAccounts(): Promise<string[]> {
    const root = (await this.api.query.sudo.key()).toString()
    return this.accounts.map(() => root)
  }

  protected async getExtrinsics(): Promise<SubmittableExtrinsic<'promise'>[]> {
    return this.accounts.map((a) => {
      return this.api.tx.sudo.sudo(
        this.api.tx.members.createMember(generateParamsFromAccountId(a, this.asFoundingMember))
      )
    })
  }

  protected async getEventFromResult(result: SubmittableResult): Promise<MemberCreatedEventDetails> {
    return this.api.getEventDetails(result, 'members', 'MemberCreated')
  }

  public getCreatedMembers(): MemberId[] {
    return this.events.map((e) => e.event.data[0])
  }

  protected assertQueriedMembersAreValid(
    qMembers: MembershipFieldsFragment[],
    qEvents: MemberCreatedEventFieldsFragment[]
  ): void {
    this.events.forEach((e, i) => {
      const account = this.accounts[i]
      const params = generateParamsFromAccountId(account)
      const qEvent = this.findMatchingQueryNodeEvent(e, qEvents)
      const qMember = qMembers.find((m) => m.id === e.event.data[0].toString())
      Utils.assert(qMember, 'Query node: Membership not found!')
      const {
        handle,
        rootAccount,
        controllerAccount,
        metadata: { name, about, avatar, externalResources },
        isVerified,
        isFoundingMember,
        entry,
        inviteCount,
      } = qMember
      const metadata = Utils.metadataFromBytes(MembershipMetadata, params.metadata)
      assert.equal(handle, params.handle)
      assert.equal(rootAccount, params.root_account)
      assert.equal(controllerAccount, params.controller_account)
      assert.equal(name, metadata.name)
      assert.equal(about, metadata.about)
      assert.equal(inviteCount, this.defaultInviteCount)
      assert.equal(avatar?.avatarUri, metadata.avatarUri || undefined)
      assert.includeDeepMembers(
        externalResources ?? [],
        metadata.externalResources?.map(asMembershipExternalResource) ?? []
      )
      assert.equal(isVerified, this.asFoundingMember)
      assert.equal(isFoundingMember, this.asFoundingMember)
      Utils.assert(entry.__typename === 'MembershipEntryMemberCreated', 'Query node: Invalid membership entry method')
      Utils.assert(entry.memberCreatedEvent)
      assert.equal(entry.memberCreatedEvent.id, qEvent.id)
    })
  }

  protected assertQueryNodeEventIsValid(qEvent: MemberCreatedEventFieldsFragment, i: number): void {
    const account = this.accounts[i]
    const eventDetails = this.events[i]
    const txParams = generateParamsFromAccountId(account)
    const metadata = Utils.metadataFromBytes(MembershipMetadata, txParams.metadata)
    assert.equal(qEvent.newMember.id, eventDetails.event.data[0].toString())
    assert.equal(qEvent.handle, txParams.handle)
    assert.equal(qEvent.rootAccount, txParams.root_account)
    assert.equal(qEvent.controllerAccount, txParams.controller_account)
    assert.equal(qEvent.isFoundingMember, this.asFoundingMember)

    assert.equal(qEvent.metadata.name, metadata.name || null)
    assert.equal(qEvent.metadata.about, metadata.about || null)
    assert.equal(qEvent.metadata.avatar?.avatarUri, metadata.avatarUri || undefined)
    assert.includeDeepMembers(
      qEvent.metadata.externalResources ?? [],
      metadata.externalResources?.map(asMembershipExternalResource) ?? []
    )
  }

  protected async loadDefaultInviteCount(): Promise<void> {
    this.defaultInviteCount = (await this.api.query.members.initialInvitationCount()).toNumber()
  }

  async execute(): Promise<void> {
    await this.loadDefaultInviteCount()
    // Add membership-price funds to accounts
    const membershipFee = await this.api.getMembershipFee()
    await Promise.all(this.accounts.map((a) => this.api.treasuryTransferBalance(a, membershipFee)))
    await super.execute()
  }

  async runQueryNodeChecks(): Promise<void> {
    await super.runQueryNodeChecks()

    const qEvents = await this.query.tryQueryWithTimeout(
      () => this.query.getMemberCreatedEvents(this.events),
      (res) => this.assertQueryNodeEventsAreValid(res)
    )

    const qMembers = await this.query.getMembersByIds(this.events.map((e) => e.event.data[0]))
    this.assertQueriedMembersAreValid(qMembers, qEvents)
  }
}
