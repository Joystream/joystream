import { Api } from '../Api'
import { KeyringPair } from '@polkadot/keyring/types'
import BN from 'bn.js'
import { assert } from 'chai'
import { Fixture } from '../IFixture'
import { PaidTermId } from '@joystream/types/members'

export class BuyMembershipHappyCaseFixture implements Fixture {
  private api: Api
  private treasury: KeyringPair
  private keyPairs: KeyringPair[]
  private paidTerms: PaidTermId

  public constructor(api: Api, treasury: KeyringPair, keyPairs: KeyringPair[], paidTerms: PaidTermId) {
    this.api = api
    this.treasury = treasury
    this.keyPairs = keyPairs
    this.paidTerms = paidTerms
  }

  public async runner(expectFailure: boolean): Promise<void> {
    // Fee estimation and transfer
    const membershipFee: BN = await this.api.getMembershipFee(this.paidTerms)
    const membershipTransactionFee: BN = this.api.estimateBuyMembershipFee(
      this.treasury,
      this.paidTerms,
      'member_name_which_is_longer_than_expected'
    )
    await this.api.transferBalanceToAccounts(
      this.treasury,
      this.keyPairs,
      membershipTransactionFee.add(new BN(membershipFee))
    )

    // Buying membership
    await Promise.all(
      this.keyPairs.map(async (keyPair) => {
        await this.api.buyMembership(keyPair, this.paidTerms, `member${keyPair.address.substring(0, 14)}`)
      })
    )

    // Assertions
    this.keyPairs.forEach((keyPair) =>
      this.api
        .getMemberIds(keyPair.address)
        .then((membership) => assert(membership.length > 0, `Account ${keyPair.address} is not a member`))
    )
    if (expectFailure) {
      throw new Error('Successful fixture run while expecting failure')
    }
  }
}

export class BuyMembershipWithInsufficienFundsFixture implements Fixture {
  private api: Api
  private treasury: KeyringPair
  private aKeyPair: KeyringPair
  private paidTerms: PaidTermId

  public constructor(api: Api, treasury: KeyringPair, aKeyPair: KeyringPair, paidTerms: PaidTermId) {
    this.api = api
    this.treasury = treasury
    this.aKeyPair = aKeyPair
    this.paidTerms = paidTerms
  }

  public async runner(expectFailure: boolean) {
    // Assertions
    this.api
      .getMemberIds(this.aKeyPair.address)
      .then((membership) => assert(membership.length === 0, 'Account A is a member'))

    // Fee estimation and transfer
    const membershipFee: BN = await this.api.getMembershipFee(this.paidTerms)
    const membershipTransactionFee: BN = this.api.estimateBuyMembershipFee(
      this.treasury,
      this.paidTerms,
      'member_name_which_is_longer_than_expected'
    )
    await this.api.transferBalance(this.treasury, this.aKeyPair.address, membershipTransactionFee)

    // Balance assertion
    await this.api
      .getBalance(this.aKeyPair.address)
      .then((balance) =>
        assert(
          balance.toBn() < membershipFee.add(membershipTransactionFee),
          'Account A already have sufficient balance to purchase membership'
        )
      )

    // Buying memebership
    await this.api.buyMembership(
      this.aKeyPair,
      this.paidTerms,
      `late_member_${this.aKeyPair.address.substring(0, 8)}`,
      true
    )

    // Assertions
    this.api
      .getMemberIds(this.aKeyPair.address)
      .then((membership) => assert(membership.length === 0, 'Account A is a member'))
    if (expectFailure) {
      throw new Error('Successful fixture run while expecting failure')
    }
  }
}
