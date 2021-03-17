import { Api } from '../Api'
import BN from 'bn.js'
import { assert } from 'chai'
import { BaseFixture } from '../Fixture'
import { MemberId } from '@joystream/types/common'
import Debugger from 'debug'
import { ISubmittableResult } from '@polkadot/types/types'

// common code for fixtures
abstract class MembershipBuyer extends BaseFixture {
  async buyMembership(account: string): Promise<ISubmittableResult> {
    const handle = this.generateHandleFromAccountId(account)
    return this.api.signAndSend(
      this.api.tx.members.buyMembership({
        root_account: account,
        controller_account: account,
        handle,
      }),
      account
    )
  }

  generateHandleFromAccountId(accountId: string): string {
    return `handle${accountId.substring(0, 14)}`
  }
}

export class BuyMembershipHappyCaseFixture extends MembershipBuyer implements BaseFixture {
  private accounts: string[]
  private debug: Debugger.Debugger
  private memberIds: MemberId[] = []

  public constructor(api: Api, accounts: string[]) {
    super(api)
    this.accounts = accounts
    this.debug = Debugger('fixture:BuyMembershipHappyCaseFixture')
  }

  public getCreatedMembers(): MemberId[] {
    return this.memberIds.slice()
  }

  async execute(): Promise<void> {
    // Fee estimation and transfer
    const membershipFee: BN = await this.api.getMembershipFee()
    const membershipTransactionFee: BN = await this.api.estimateBuyMembershipFee(
      this.accounts[0],
      this.generateHandleFromAccountId(this.accounts[0])
    )
    const estimatedFee = membershipTransactionFee.add(new BN(membershipFee))

    await this.api.treasuryTransferBalanceToAccounts(this.accounts, estimatedFee)

    this.memberIds = (await Promise.all(this.accounts.map((account) => this.buyMembership(account))))
      .map(({ events }) => this.api.findMemberBoughtEvent(events))
      .filter((id) => id !== undefined) as MemberId[]

    this.debug(`Registered ${this.memberIds.length} new members`)

    assert.equal(this.memberIds.length, this.accounts.length)

    // Assert that created members have expected root and controller accounts
    const members = await Promise.all(this.memberIds.map((id) => this.api.query.members.membershipById(id)))

    members.forEach((member, index) => {
      assert(member.root_account.eq(this.accounts[index]))
      assert(member.controller_account.eq(this.accounts[index]))
    })
  }
}

export class BuyMembershipWithInsufficienFundsFixture extends MembershipBuyer implements BaseFixture {
  private account: string

  public constructor(api: Api, account: string) {
    super(api)
    this.account = account
  }

  async execute(): Promise<void> {
    // It is acceptable for same account to register a new member account
    // So no need to assert that account is not already used as a controller or root for another member
    // const membership = await this.api.getMemberIds(this.account)
    // assert(membership.length === 0, 'Account must not be associated with a member')

    // Fee estimation and transfer
    const membershipFee: BN = await this.api.getMembershipFee()
    const membershipTransactionFee: BN = await this.api.estimateBuyMembershipFee(
      this.account,
      this.generateHandleFromAccountId(this.account)
    )

    // Only provide enough funds for transaction fee but not enough to cover the membership fee
    await this.api.treasuryTransferBalance(this.account, membershipTransactionFee)

    const balance = await this.api.getBalance(this.account)

    assert(
      balance.toBn() < membershipFee.add(membershipTransactionFee),
      'Account already has sufficient balance to purchase membership'
    )

    const result = await this.buyMembership(this.account)

    this.expectDispatchError(result, 'Buying membership with insufficient funds should fail.')

    // Assert that failure occured for expected reason
    assert.equal(this.api.getErrorNameFromExtrinsicFailedRecord(result), 'NotEnoughBalanceToBuyMembership')
  }
}
