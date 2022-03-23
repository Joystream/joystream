import BN from 'bn.js'
import { Api } from '../../Api'
import { assert } from 'chai'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { generateParamsFromAccountId } from './utils'
import { BaseFixture } from '../../Fixture'

export class BuyMembershipWithInsufficienFundsFixture extends BaseFixture {
  private account: string

  public constructor(api: Api, account: string) {
    super(api)
    this.account = account
  }

  private generateBuyMembershipTx(accountId: string): SubmittableExtrinsic<'promise'> {
    return this.api.tx.members.buyMembership(generateParamsFromAccountId(accountId))
  }

  async execute(): Promise<void> {
    // It is acceptable for same account to register a new member account
    // So no need to assert that account is not already used as a controller or root for another member
    // const membership = await this.api.getMemberIds(this.account)
    // assert(membership.length === 0, 'Account must not be associated with a member')

    // Fee estimation and transfer
    const membershipFee: BN = await this.api.getMembershipFee()
    const membershipTransactionFee: BN = await this.api.estimateTxFee(
      this.generateBuyMembershipTx(this.account),
      this.account
    )

    // Only provide enough funds for transaction fee but not enough to cover the membership fee
    await this.api.treasuryTransferBalance(this.account, membershipTransactionFee)

    const balance = await this.api.getBalance(this.account)

    assert.isBelow(
      balance.toNumber(),
      membershipFee.add(membershipTransactionFee).toNumber(),
      'Account already has sufficient balance to purchase membership'
    )

    const result = await this.api.signAndSend(this.generateBuyMembershipTx(this.account), this.account)

    this.expectDispatchError(result, 'Buying membership with insufficient funds should fail.')

    // Assert that failure occured for expected reason
    assert.equal(this.api.getErrorNameFromExtrinsicFailedRecord(result), 'NotEnoughBalanceToBuyMembership')
  }
}
