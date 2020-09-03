import { WsProvider } from '@polkadot/api'
import { registerJoystreamTypes } from '@rome/types'
import { Keyring } from '@polkadot/keyring'
import { assert } from 'chai'
import { KeyringPair } from '@polkadot/keyring/types'
import BN from 'bn.js'
import { ApiWrapper } from '../../utils/apiWrapper'
import { v4 as uuid } from 'uuid'
import tap from 'tap'

export function membershipTest(
  nKeyPairs: KeyringPair[],
  keyring: Keyring,
  n: number,
  paidTerms: number,
  nodeUrl: string,
  sudoUri: string
) {
  let apiWrapper: ApiWrapper
  let sudo: KeyringPair
  let aKeyPair: KeyringPair
  let membershipFee: BN
  let membershipTransactionFee: BN

  tap.test('Membership creation test setup', async () => {
    registerJoystreamTypes()
    const provider = new WsProvider(nodeUrl)
    apiWrapper = await ApiWrapper.create(provider)
    sudo = keyring.addFromUri(sudoUri)
    for (let i = 0; i < n; i++) {
      nKeyPairs.push(keyring.addFromUri(i + uuid().substring(0, 8)))
    }
    aKeyPair = keyring.addFromUri(uuid().substring(0, 8))
    membershipFee = await apiWrapper.getMembershipFee(paidTerms)
    membershipTransactionFee = apiWrapper.estimateBuyMembershipFee(
      sudo,
      paidTerms,
      'member_name_which_is_longer_than_expected'
    )
    await apiWrapper.transferBalanceToAccounts(sudo, nKeyPairs, membershipTransactionFee.add(new BN(membershipFee)))
    await apiWrapper.transferBalance(sudo, aKeyPair.address, membershipTransactionFee)
  })

  tap.test('Buy membeship is accepted with sufficient funds', async () => {
    await Promise.all(
      nKeyPairs.map(async (keyPair, index) => {
        await apiWrapper.buyMembership(keyPair, paidTerms, `new_member_${index}${keyPair.address.substring(0, 8)}`)
      })
    )
    nKeyPairs.forEach((keyPair, index) =>
      apiWrapper
        .getMemberIds(keyPair.address)
        .then((membership) => assert(membership.length > 0, `Account ${keyPair.address} is not a member`))
    )
  })

  tap.test('Account A can not buy the membership with insufficient funds', async () => {
    await apiWrapper
      .getBalance(aKeyPair.address)
      .then((balance) =>
        assert(
          balance.toBn() < membershipFee.add(membershipTransactionFee),
          'Account A already have sufficient balance to purchase membership'
        )
      )
    await apiWrapper.buyMembership(aKeyPair, paidTerms, `late_member_${aKeyPair.address.substring(0, 8)}`, true)
    apiWrapper
      .getMemberIds(aKeyPair.address)
      .then((membership) => assert(membership.length === 0, 'Account A is a member'))
  })

  tap.test('Account A was able to buy the membership with sufficient funds', async () => {
    await apiWrapper.transferBalance(sudo, aKeyPair.address, membershipFee.add(membershipTransactionFee))
    apiWrapper
      .getBalance(aKeyPair.address)
      .then((balance) =>
        assert(balance.toBn() >= membershipFee, 'The account balance is insufficient to purchase membership')
      )
    await apiWrapper.buyMembership(aKeyPair, paidTerms, `late_member_${aKeyPair.address.substring(0, 8)}`)
    apiWrapper
      .getMemberIds(aKeyPair.address)
      .then((membership) => assert(membership.length > 0, 'Account A is a not member'))
  })

  tap.teardown(() => {
    apiWrapper.close()
  })
}
