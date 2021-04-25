import BN from 'bn.js'
import { Api } from '../../Api'
import { assert } from 'chai'
import { BaseMembershipFixture } from './BaseMembershipFixture'
import { MemberId } from '@joystream/types/common'
import { QueryNodeApi } from '../../QueryNodeApi'
import { Membership } from '@joystream/types/members'
import { EventType, MembershipEntryMethod } from '../../graphql/generated/schema'
import { blake2AsHex } from '@polkadot/util-crypto'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { MembershipMetadata } from '@joystream/metadata-protobuf'
import { MembershipBoughtEventDetails } from '../../types'
import { MembershipBoughtEventFieldsFragment, MembershipFieldsFragment } from '../../graphql/generated/queries'

export class BuyMembershipHappyCaseFixture extends BaseMembershipFixture {
  private accounts: string[]
  private memberIds: MemberId[] = []

  private extrinsics: SubmittableExtrinsic<'promise'>[] = []
  private events: MembershipBoughtEventDetails[] = []
  private members: Membership[] = []

  public constructor(api: Api, query: QueryNodeApi, accounts: string[]) {
    super(api, query)
    this.accounts = accounts
  }

  private generateBuyMembershipTx(accountId: string): SubmittableExtrinsic<'promise'> {
    return this.api.tx.members.buyMembership(this.generateParamsFromAccountId(accountId))
  }

  public getCreatedMembers(): MemberId[] {
    return this.memberIds.slice()
  }

  private assertMemberMatchQueriedResult(member: Membership, qMember: MembershipFieldsFragment | null) {
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
    } = qMember
    const txParams = this.generateParamsFromAccountId(rootAccount)
    const metadata = MembershipMetadata.deserializeBinary(txParams.metadata.toU8a(true))
    assert.equal(blake2AsHex(handle), member.handle_hash.toString())
    assert.equal(handle, txParams.handle)
    assert.equal(rootAccount, member.root_account.toString())
    assert.equal(controllerAccount, member.controller_account.toString())
    assert.equal(name, metadata.getName())
    assert.equal(about, metadata.getAbout())
    // TODO: avatar
    assert.equal(isVerified, false)
    assert.equal(entry, MembershipEntryMethod.Paid)
  }

  private assertEventMatchQueriedResult(
    eventDetails: MembershipBoughtEventDetails,
    account: string,
    txHash: string,
    qEvent: MembershipBoughtEventFieldsFragment | null
  ) {
    if (!qEvent) {
      throw new Error('Query node: MembershipBought event not found!')
    }
    const txParams = this.generateParamsFromAccountId(account)
    const metadata = MembershipMetadata.deserializeBinary(txParams.metadata.toU8a(true))
    assert.equal(qEvent.event.inBlock.number, eventDetails.blockNumber)
    assert.equal(qEvent.event.inExtrinsic, txHash)
    assert.equal(qEvent.event.indexInBlock, eventDetails.indexInBlock)
    assert.equal(qEvent.event.type, EventType.MembershipBought)
    assert.equal(qEvent.newMember.id, eventDetails.memberId.toString())
    assert.equal(qEvent.handle, txParams.handle)
    assert.equal(qEvent.rootAccount, txParams.root_account.toString())
    assert.equal(qEvent.controllerAccount, txParams.controller_account.toString())
    assert.equal(qEvent.metadata.name, metadata.getName())
    assert.equal(qEvent.metadata.about, metadata.getAbout())
    // TODO: avatar
  }

  async execute(): Promise<void> {
    // Fee estimation and transfer
    const membershipFee = await this.api.getMembershipFee()
    const membershipTransactionFee = await this.api.estimateTxFee(
      this.generateBuyMembershipTx(this.accounts[0]),
      this.accounts[0]
    )
    const estimatedFee = membershipTransactionFee.add(new BN(membershipFee))

    await this.api.treasuryTransferBalanceToAccounts(this.accounts, estimatedFee)

    this.extrinsics = this.accounts.map((a) => this.generateBuyMembershipTx(a))
    const results = await Promise.all(this.accounts.map((a, i) => this.api.signAndSend(this.extrinsics[i], a)))
    this.events = await Promise.all(results.map((r) => this.api.retrieveMembershipBoughtEventDetails(r)))
    this.memberIds = this.events.map((e) => e.memberId)

    this.debug(`Registered ${this.memberIds.length} new members`)

    assert.equal(this.memberIds.length, this.accounts.length)

    // Assert that created members have expected root and controller accounts
    this.members = await Promise.all(this.memberIds.map((id) => this.api.query.members.membershipById(id)))

    this.members.forEach((member, index) => {
      assert(member.root_account.eq(this.accounts[index]))
      assert(member.controller_account.eq(this.accounts[index]))
    })
  }

  async runQueryNodeChecks(): Promise<void> {
    await super.runQueryNodeChecks()
    // Ensure newly created members were parsed by query node
    await Promise.all(
      this.members.map(async (member, i) => {
        const memberId = this.memberIds[i]
        await this.query.tryQueryWithTimeout(
          () => this.query.getMemberById(memberId),
          (qMember) => this.assertMemberMatchQueriedResult(member, qMember)
        )
        // Ensure the query node event is valid
        const qEvent = await this.query.getMembershipBoughtEvent(memberId)
        this.assertEventMatchQueriedResult(this.events[i], this.accounts[i], this.extrinsics[i].hash.toString(), qEvent)
      })
    )
  }
}
