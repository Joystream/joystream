import { Api } from '../../Api'
import { assert } from 'chai'
import { generateParamsFromAccountId } from './utils'
import { MemberId } from '@joystream/types/common'
import { QueryNodeApi } from '../../QueryNodeApi'
import { Membership } from '@joystream/types/members'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { MembershipMetadata } from '@joystream/metadata-protobuf'
import { EventDetails, EventType } from '../../types'
import { MembershipBoughtEventFieldsFragment, MembershipFieldsFragment } from '../../graphql/generated/queries'
import { Utils } from '../../utils'
import { StandardizedFixture } from '../../Fixture'
import { SubmittableResult } from '@polkadot/api'

type MembershipBoughtEventDetails = EventDetails<EventType<'members', 'MembershipBought'>>

export class BuyMembershipHappyCaseFixture extends StandardizedFixture {
  protected accounts: string[]
  protected memberIds: MemberId[] = []
  protected events: MembershipBoughtEventDetails[] = []
  protected members: Membership[] = []

  public constructor(api: Api, query: QueryNodeApi, accounts: string[]) {
    super(api, query)
    this.accounts = accounts
  }

  protected async getSignerAccountOrAccounts(): Promise<string[]> {
    return this.accounts
  }

  protected async getExtrinsics(): Promise<SubmittableExtrinsic<'promise'>[]> {
    return this.accounts.map((a) => this.api.tx.members.buyMembership(generateParamsFromAccountId(a)))
  }

  protected async getEventFromResult(result: SubmittableResult): Promise<MembershipBoughtEventDetails> {
    return this.api.getEventDetails(result, 'members', 'MembershipBought')
  }

  public getCreatedMembers(): MemberId[] {
    return this.events.map((e) => e.event.data[0])
  }

  protected assertQueriedMembersAreValid(
    qMembers: MembershipFieldsFragment[],
    qEvents: MembershipBoughtEventFieldsFragment[]
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
        metadata: { name, about },
        isVerified,
        entry,
      } = qMember
      const metadata = Utils.metadataFromBytes(MembershipMetadata, params.metadata)
      assert.equal(handle, params.handle)
      assert.equal(rootAccount, params.root_account)
      assert.equal(controllerAccount, params.controller_account)
      assert.equal(name, metadata.name)
      assert.equal(about, metadata.about)
      // TODO: avatar
      assert.equal(isVerified, false)
      Utils.assert(entry.__typename === 'MembershipEntryPaid', 'Query node: Invalid membership entry method')
      Utils.assert(entry.membershipBoughtEvent)
      assert.equal(entry.membershipBoughtEvent.id, qEvent.id)
    })
  }

  protected assertQueryNodeEventIsValid(qEvent: MembershipBoughtEventFieldsFragment, i: number): void {
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
    // TODO: avatar
  }

  async execute(): Promise<void> {
    // Add membership-price funds to accounts
    const membershipFee = await this.api.getMembershipFee()
    await Promise.all(this.accounts.map((a) => this.api.treasuryTransferBalance(a, membershipFee)))
    await super.execute()
  }

  async runQueryNodeChecks(): Promise<void> {
    await super.runQueryNodeChecks()

    const qEvents = await this.query.tryQueryWithTimeout(
      () => this.query.getMembershipBoughtEvents(this.events),
      (r) => this.assertQueryNodeEventsAreValid(r)
    )

    const qMembers = await this.query.getMembersByIds(this.events.map((e) => e.event.data[0]))
    this.assertQueriedMembersAreValid(qMembers, qEvents)
  }
}
