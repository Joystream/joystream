import { Api } from '../Api'
import BN from 'bn.js'
import { assert } from 'chai'
import { Fixture, BaseFixture } from '../Fixture'
import { PaidTermId, MemberId } from '@joystream/types/members'
import Debugger from 'debug'

export class BuyMembershipHappyCaseFixture extends BaseFixture {
  private accounts: string[]
  private paidTerms: PaidTermId
  private debug: Debugger.Debugger
  private memberIds: MemberId[] = []

  public constructor(api: Api, accounts: string[], paidTerms: PaidTermId) {
    super(api)
    this.accounts = accounts
    this.paidTerms = paidTerms
    this.debug = Debugger('fixture:BuyMembershipHappyCaseFixture')
  }

  public getCreatedMembers(): MemberId[] {
    return this.memberIds.slice()
  }

  public async execute(expectFailure: boolean): Promise<void> {
    this.debug(`Registering ${this.accounts.length} new members`)
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
    ).map(({ events }) => this.api.expectMemberRegisteredEvent(events))

    this.debug(`New member ids: ${this.memberIds}`)
    if (expectFailure) {
      throw new Error('Successful fixture run while expecting failure')
    }
  }
}

export class BuyMembershipWithInsufficienFundsFixture implements Fixture {
  private api: Api
  private account: string
  private paidTerms: PaidTermId

  public constructor(api: Api, account: string, paidTerms: PaidTermId) {
    this.api = api
    this.account = account
    this.paidTerms = paidTerms
  }

  public async runner(expectFailure: boolean) {
    // Assertions
    this.api.getMemberIds(this.account).then((membership) => assert(membership.length === 0, 'Account A is a member'))

    // Fee estimation and transfer
    const membershipFee: BN = await this.api.getMembershipFee(this.paidTerms)
    const membershipTransactionFee: BN = this.api.estimateBuyMembershipFee(
      this.account,
      this.paidTerms,
      'member_name_which_is_longer_than_expected'
    )
    this.api.treasuryTransferBalance(this.account, membershipTransactionFee)

    // Balance assertion
    await this.api
      .getBalance(this.account)
      .then((balance) =>
        assert(
          balance.toBn() < membershipFee.add(membershipTransactionFee),
          'Account A already have sufficient balance to purchase membership'
        )
      )

    // Buying memebership
    await this.api.buyMembership(this.account, this.paidTerms, `late_member_${this.account.substring(0, 8)}`, true)

    // Assertions
    this.api.getMemberIds(this.account).then((membership) => assert(membership.length === 0, 'Account A is a member'))
    if (expectFailure) {
      throw new Error('Successful fixture run while expecting failure')
    }
  }
}
