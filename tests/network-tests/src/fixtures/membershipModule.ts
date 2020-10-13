import { Api } from '../Api'
import BN from 'bn.js'
import { assert } from 'chai'
import { Fixture } from '../IFixture'
import { PaidTermId } from '@joystream/types/members'

export class BuyMembershipHappyCaseFixture implements Fixture {
  private api: Api
  private accounts: string[]
  private paidTerms: PaidTermId

  public constructor(api: Api, accounts: string[], paidTerms: PaidTermId) {
    this.api = api
    this.accounts = accounts
    this.paidTerms = paidTerms
  }

  public async runner(expectFailure: boolean): Promise<void> {
    // Fee estimation and transfer
    const membershipFee: BN = await this.api.getMembershipFee(this.paidTerms)
    const membershipTransactionFee: BN = this.api.estimateBuyMembershipFee(
      this.accounts[0],
      this.paidTerms,
      'member_name_which_is_longer_than_expected'
    )
    await this.api.treasuryTransferBalanceToAccounts(this.accounts, membershipTransactionFee.add(new BN(membershipFee)))

    // Buying membership
    await Promise.all(
      this.accounts.map(async (account) => {
        await this.api.buyMembership(account, this.paidTerms, `member${account.substring(0, 14)}`)
      })
    )

    // Assertions
    this.accounts.forEach((account) =>
      this.api
        .getMemberIds(account)
        .then((membership) => assert(membership.length > 0, `Account ${account} is not a member`))
    )

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
    await this.api.treasuryTransferBalance(this.account, membershipTransactionFee)

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
