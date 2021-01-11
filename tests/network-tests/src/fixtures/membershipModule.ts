import { Api } from '../Api'
import BN from 'bn.js'
import { assert } from 'chai'
import { BaseFixture } from '../Fixture'
import { MemberId } from '@joystream/types/common'
import Debugger from 'debug'
import { ISubmittableResult } from '@polkadot/types/types'

function generateHandleFromAccountId(accountId: string): string {
  return `handle${accountId.substring(0, 14)}`
}

export class BuyMembershipHappyCaseFixture extends BaseFixture {
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

  // TODO: Factor our this method using mixin pattern https://www.typescriptlang.org/docs/handbook/mixins.html
  // Buy a membership, setting root and controller accounts to be the same as the origin/sender account id
  // and handle generated from account id.
  private async buyMembership(account: string): Promise<ISubmittableResult> {
    const handle = generateHandleFromAccountId(account)
    return this.api.signAndSend(
      this.api.tx.members.buyMembership({
        root_account: account,
        controller_account: account,
        handle,
      }),
      account
    )
  }

  async execute(): Promise<void> {
    // Fee estimation and transfer
    const membershipFee: BN = await this.api.getMembershipFee()
    const membershipTransactionFee: BN = this.api.estimateBuyMembershipFee(this.accounts[0], 'handle')
    const estimatedFee = membershipTransactionFee.add(new BN(membershipFee))

    this.api.treasuryTransferBalanceToAccounts(this.accounts, estimatedFee)

    this.memberIds = (await Promise.all(this.accounts.map((account) => this.buyMembership(account))))
      .map(({ events }) => this.api.findMemberRegisteredEvent(events))
      .filter((id) => id !== undefined) as MemberId[]

    this.debug(`Registered ${this.memberIds.length} new members`)

    assert.equal(this.memberIds.length, this.accounts.length)

    // Assert that created members have expected handle and root and controller accounts
  }
}

export class BuyMembershipWithInsufficienFundsFixture extends BaseFixture {
  private account: string

  public constructor(api: Api, account: string) {
    super(api)
    this.account = account
  }

  // Buy a membership, setting root and controller accounts to be the same as the origin/sender account id
  // and handle generated from account id.
  private async buyMembership(account: string): Promise<ISubmittableResult> {
    const handle = generateHandleFromAccountId(account)
    return this.api.signAndSend(
      this.api.tx.members.buyMembership({
        root_account: account,
        controller_account: account,
        handle,
      }),
      account
    )
  }

  async execute(): Promise<void> {
    // It is acceptable for same account to register a new member account
    // So no need to assert
    // const membership = await this.api.getMemberIds(this.account)
    // assert(membership.length === 0, 'Account must not be associated with a member')

    // Fee estimation and transfer
    const membershipFee: BN = await this.api.getMembershipFee()
    const membershipTransactionFee: BN = this.api.estimateBuyMembershipFee(
      this.account,
      generateHandleFromAccountId(this.account)
    )

    // Only provide enough funds for transaction fee but not enough to cover the membership fee
    await this.api.treasuryTransferBalance(this.account, membershipTransactionFee)

    const balance = await this.api.getBalance(this.account)

    assert(
      balance.toBn() < membershipFee.add(membershipTransactionFee),
      'Account already has sufficient balance to purchase membership'
    )

    const result = this.expectDispatchError(
      await this.buyMembership(this.account),
      'Buying membership with insufficient funds should fail.'
    )

    // Assert that failure is because of lack of balance
    assert.equal(this.api.getErrorNameFromExtrinsicFailedRecord(result), 'NotEnoughBalanceToBuyMembership')
  }
}
