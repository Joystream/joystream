import { ApiWrapper } from '../../utils/apiWrapper'
import { KeyringPair } from '@polkadot/keyring/types'
import BN from 'bn.js'
import { assert } from 'chai'
import { Fixture } from './interfaces/fixture'
import { PaidTermId } from '@nicaea/types/members'

export class BuyMembershipHappyCaseFixture implements Fixture {
  private apiWrapper: ApiWrapper
  private sudo: KeyringPair
  private keyPairs: KeyringPair[]
  private paidTerms: PaidTermId

  public constructor(apiWrapper: ApiWrapper, sudo: KeyringPair, keyPairs: KeyringPair[], paidTerms: PaidTermId) {
    this.apiWrapper = apiWrapper
    this.sudo = sudo
    this.keyPairs = keyPairs
    this.paidTerms = paidTerms
  }

  public async runner(expectFailure: boolean): Promise<void> {
    // Fee estimation and transfer
    const membershipFee: BN = await this.apiWrapper.getMembershipFee(this.paidTerms)
    const membershipTransactionFee: BN = this.apiWrapper.estimateBuyMembershipFee(
      this.sudo,
      this.paidTerms,
      'member_name_which_is_longer_than_expected'
    )
    await this.apiWrapper.transferBalanceToAccounts(
      this.sudo,
      this.keyPairs,
      membershipTransactionFee.add(new BN(membershipFee))
    )

    // Buying membership
    await Promise.all(
      this.keyPairs.map(async (keyPair, index) => {
        await this.apiWrapper.buyMembership(
          keyPair,
          this.paidTerms,
          `new_member_${index}${keyPair.address.substring(0, 8)}`
        )
      })
    )

    // Assertions
    this.keyPairs.forEach((keyPair) =>
      this.apiWrapper
        .getMemberIds(keyPair.address)
        .then((membership) => assert(membership.length > 0, `Account ${keyPair.address} is not a member`))
    )
    if (expectFailure) {
      throw new Error('Successful fixture run while expecting failure')
    }
  }
}

export class BuyMembershipWithInsufficienFundsFixture implements Fixture {
  private apiWrapper: ApiWrapper
  private sudo: KeyringPair
  private aKeyPair: KeyringPair
  private paidTerms: PaidTermId

  public constructor(apiWrapper: ApiWrapper, sudo: KeyringPair, aKeyPair: KeyringPair, paidTerms: PaidTermId) {
    this.apiWrapper = apiWrapper
    this.sudo = sudo
    this.aKeyPair = aKeyPair
    this.paidTerms = paidTerms
  }

  public async runner(expectFailure: boolean) {
    // Fee estimation and transfer
    const membershipFee: BN = await this.apiWrapper.getMembershipFee(this.paidTerms)
    const membershipTransactionFee: BN = this.apiWrapper.estimateBuyMembershipFee(
      this.sudo,
      this.paidTerms,
      'member_name_which_is_longer_than_expected'
    )
    await this.apiWrapper.transferBalance(this.sudo, this.aKeyPair.address, membershipTransactionFee)

    // Balance assertion
    await this.apiWrapper
      .getBalance(this.aKeyPair.address)
      .then((balance) =>
        assert(
          balance.toBn() < membershipFee.add(membershipTransactionFee),
          'Account A already have sufficient balance to purchase membership'
        )
      )

    // Buying memebership
    await this.apiWrapper.buyMembership(
      this.aKeyPair,
      this.paidTerms,
      `late_member_${this.aKeyPair.address.substring(0, 8)}`,
      true
    )

    // Assertions
    this.apiWrapper
      .getMemberIds(this.aKeyPair.address)
      .then((membership) => assert(membership.length === 0, 'Account A is a member'))
    if (expectFailure) {
      throw new Error('Successful fixture run while expecting failure')
    }
  }
}
