import { Api } from '../../Api'
import { assert } from 'chai'
import { asMembershipExternalResource, generateParamsFromAccountId } from './utils'
import { MemberId } from '@joystream/types/primitives'
import { QueryNodeApi } from '../../QueryNodeApi'
import { PalletMembershipMembershipObject as Membership } from '@polkadot/types/lookup'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { MembershipMetadata } from '@joystream/metadata-protobuf'
import { EventDetails, EventType } from '../../types'
import { MembershipGiftedEventFieldsFragment, MembershipFieldsFragment } from '../../graphql/generated/queries'
import { Utils } from '../../utils'
import { StandardizedFixture } from '../../Fixture'
import { SubmittableResult } from '@polkadot/api'

type MembershipGiftedEventDetails = EventDetails<EventType<'members', 'MembershipGifted'>>

export class GiftMembershipHappyCaseFixture extends StandardizedFixture {
  protected gifterAccount: string
  protected accounts: string[]
  protected memberIds: MemberId[] = []
  protected events: MembershipGiftedEventDetails[] = []
  protected members: Membership[] = []
  protected defaultInviteCount!: number

  public constructor(api: Api, query: QueryNodeApi, gifterAccount: string, accounts: string[]) {
    super(api, query)
    this.gifterAccount = gifterAccount
    this.accounts = accounts
  }

  protected async getSignerAccountOrAccounts(): Promise<string[]> {
    return this.accounts.map(() => this.gifterAccount)
  }

  protected async getExtrinsics(): Promise<SubmittableExtrinsic<'promise'>[]> {
    return this.accounts.map((a) => this.api.tx.members.giftMembership(generateParamsFromAccountId(a)))
  }

  protected async getEventFromResult(result: SubmittableResult): Promise<MembershipGiftedEventDetails> {
    return this.api.getEventDetails(result, 'members', 'MembershipGifted')
  }

  public getCreatedMembers(): MemberId[] {
    return this.events.map((e) => e.event.data[0])
  }

  protected assertQueriedMembersAreValid(
    qMembers: MembershipFieldsFragment[],
    qEvents: MembershipGiftedEventFieldsFragment[]
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
      assert.equal(inviteCount, 0)
      assert.equal(avatar?.avatarUri, metadata.avatarUri || undefined)
      assert.includeDeepMembers(
        externalResources ?? [],
        metadata.externalResources?.map(asMembershipExternalResource) ?? []
      )
      assert.equal(isVerified, false)
      assert.equal(isFoundingMember, false)
      Utils.assert(entry.__typename === 'MembershipEntryGifted', 'Query node: Invalid membership entry method')
      Utils.assert(entry.membershipGiftedEvent)
      assert.equal(entry.membershipGiftedEvent.id, qEvent.id)
    })
  }

  protected assertQueryNodeEventIsValid(qEvent: MembershipGiftedEventFieldsFragment, i: number): void {
    const account = this.accounts[i]
    const eventDetails = this.events[i]
    const txParams = generateParamsFromAccountId(account)
    const metadata = Utils.metadataFromBytes(MembershipMetadata, txParams.metadata)
    assert.equal(qEvent.newMember.id, eventDetails.event.data[0].toString())
    assert.equal(qEvent.handle, txParams.handle)
    assert.equal(qEvent.rootAccount, txParams.root_account)
    assert.equal(qEvent.controllerAccount, txParams.controller_account)

    assert.equal(qEvent.metadata.name, metadata.name || null)
    assert.equal(qEvent.metadata.about, metadata.about || null)
    assert.equal(qEvent.metadata.avatar?.avatarUri, metadata.avatarUri || undefined)
    assert.includeDeepMembers(
      qEvent.metadata.externalResources ?? [],
      metadata.externalResources?.map(asMembershipExternalResource) ?? []
    )
  }

  async execute(): Promise<void> {
    const membershipFee = await this.api.getMembershipFee()
    await this.api.treasuryTransferBalance(this.gifterAccount, membershipFee.muln(this.accounts.length))
    await super.execute()
  }

  async runQueryNodeChecks(): Promise<void> {
    await super.runQueryNodeChecks()

    const qEvents = await this.query.tryQueryWithTimeout(
      () => this.query.getMembershipGiftedEvents(this.events),
      (res) => this.assertQueryNodeEventsAreValid(res)
    )

    const qMembers = await this.query.getMembersByIds(this.events.map((e) => e.event.data[0]))
    this.assertQueriedMembersAreValid(qMembers, qEvents)
  }
}
