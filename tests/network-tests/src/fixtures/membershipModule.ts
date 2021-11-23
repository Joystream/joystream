import { Api } from '../Api'
import BN from 'bn.js'
import { assert } from 'chai'
import { BaseFixture } from '../Fixture'
import { PaidTermId, MemberId } from '@joystream/types/members'
import { Debugger, extendDebug } from '../Debugger'

export class BuyMembershipHappyCaseFixture extends BaseFixture {
  private accounts: string[]
  private paidTerms: PaidTermId
  private debug: Debugger.Debugger
  private memberIds: MemberId[] = []

  public constructor(api: Api, accounts: string[], paidTerms: PaidTermId) {
    super(api)
    this.accounts = accounts
    this.paidTerms = paidTerms
    this.debug = extendDebug('fixture:BuyMembershipHappyCaseFixture')
  }

  public getCreatedMembers(): MemberId[] {
    return this.memberIds.slice()
  }

  async execute(): Promise<void> {
    // Fee estimation and transfer
    const membershipFee: BN = await this.api.getMembershipFee(this.paidTerms)
    const membershipTransactionFee: BN = this.api.estimateBuyMembershipFee(
      this.accounts[0],
      this.paidTerms,
      'member_name_which_is_longer_than_expected'
    )

    this.api.treasuryTransferBalanceToAccounts(this.accounts, membershipTransactionFee.add(new BN(membershipFee)))

    this.memberIds = (
      await Promise.all(
        this.accounts.map((account) =>
          this.api.buyMembership(account, this.paidTerms, `member${account.substring(0, 14)}`)
        )
      )
    )
      .map((r) => this.api.findEvent(r, 'members', 'MemberRegistered')?.data[0])
      .filter((id) => id !== undefined) as MemberId[]

    this.debug(`Registered ${this.memberIds.length} new members`)

    assert.equal(this.memberIds.length, this.accounts.length)
  }
}

export class BuyMembershipWithInsufficienFundsFixture extends BaseFixture {
  private account: string
  private paidTerms: PaidTermId

  public constructor(api: Api, account: string, paidTerms: PaidTermId) {
    super(api)
    this.account = account
    this.paidTerms = paidTerms
  }

  async execute(): Promise<void> {
    // Assertions
    const membership = await this.api.getMemberIds(this.account)

    assert(membership.length === 0, 'Account must not be associated with a member')

    // Fee estimation and transfer
    const membershipFee: BN = await this.api.getMembershipFee(this.paidTerms)
    const membershipTransactionFee: BN = this.api.estimateBuyMembershipFee(
      this.account,
      this.paidTerms,
      'member_name_which_is_longer_than_expected'
    )

    // Only provide enough funds for transaction fee but not enough to cover the membership fee
    await this.api.treasuryTransferBalance(this.account, membershipTransactionFee)

    const balance = await this.api.getBalance(this.account)

    assert(
      balance.toBn() < membershipFee.add(membershipTransactionFee),
      'Account already has sufficient balance to purchase membership'
    )

    this.expectDispatchError(
      await this.api.buyMembership(this.account, this.paidTerms, `late_member_${this.account.substring(0, 8)}`),
      'Buying membership with insufficient funds should fail.'
    )
  }
}
