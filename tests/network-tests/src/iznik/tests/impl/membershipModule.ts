import { ApiWrapper } from '../../utils/apiWrapper'
import { KeyringPair } from '@polkadot/keyring/types'
import { Keyring } from '@polkadot/api'
import { v4 as uuid } from 'uuid'
import BN from 'bn.js'
import { assert } from 'chai'

export class BuyMembershipHappyCaseFixture {
  private keyPairs: KeyringPair[] = []

  public getKeyPairs(): KeyringPair[] {
    return this.keyPairs
  }

  public async runner(
    apiWrapper: ApiWrapper,
    sudo: KeyringPair,
    keyPairs: KeyringPair[],
    keyring: Keyring,
    n: number,
    paidTerms: number
  ): Promise<void> {
    // Account creation
    for (let i = 0; i < n; i++) {
      keyPairs.push(keyring.addFromUri(i + uuid().substring(0, 8)))
    }

    // Fee estimation and transfer
    const membershipFee: BN = await apiWrapper.getMembershipFee(paidTerms)
    const membershipTransactionFee: BN = apiWrapper.estimateBuyMembershipFee(
      sudo,
      paidTerms,
      'member_name_which_is_longer_than_expected'
    )
    await apiWrapper.transferBalanceToAccounts(sudo, keyPairs, membershipTransactionFee.add(new BN(membershipFee)))

    // Buying membership
    await Promise.all(
      keyPairs.map(async (keyPair, index) => {
        await apiWrapper.buyMembership(keyPair, paidTerms, `new_member_${index}${keyPair.address.substring(0, 8)}`)
      })
    )

    // Assertions
    keyPairs.forEach((keyPair, index) =>
      apiWrapper
        .getMemberIds(keyPair.address)
        .then((membership) => assert(membership.length > 0, `Account ${keyPair.address} is not a member`))
    )

    this.keyPairs = keyPairs
  }
}

export class BuyMembershipWithInsufficienFunds {
  public async runner(
    apiWrapper: ApiWrapper,
    sudo: KeyringPair,
    aKeyPair: KeyringPair,
    keyring: Keyring,
    paidTerms: number
  ) {
    // Account creation
    aKeyPair = keyring.addFromUri(uuid().substring(0, 8))

    // Fee estimation and transfer
    const membershipFee: BN = await apiWrapper.getMembershipFee(paidTerms)
    const membershipTransactionFee: BN = apiWrapper.estimateBuyMembershipFee(
      sudo,
      paidTerms,
      'member_name_which_is_longer_than_expected'
    )
    await apiWrapper.transferBalance(sudo, aKeyPair.address, membershipTransactionFee)

    // Balance assertion
    await apiWrapper
      .getBalance(aKeyPair.address)
      .then((balance) =>
        assert(
          balance.toBn() < membershipFee.add(membershipTransactionFee),
          'Account A already have sufficient balance to purchase membership'
        )
      )

    // Buying memebership
    await apiWrapper.buyMembership(aKeyPair, paidTerms, `late_member_${aKeyPair.address.substring(0, 8)}`, true)

    // Assertions
    apiWrapper
      .getMemberIds(aKeyPair.address)
      .then((membership) => assert(membership.length === 0, 'Account A is a member'))
  }
}
