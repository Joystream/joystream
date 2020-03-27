import { WsProvider } from '@polkadot/api';
import { registerJoystreamTypes } from '@joystream/types';
import { Keyring } from '@polkadot/keyring';
import { assert } from 'chai';
import { KeyringPair } from '@polkadot/keyring/types';
import BN = require('bn.js');
import { ApiMethods } from '../utils/apiMethods';
import { initConfig } from '../utils/config';

describe('Membership integration tests', () => {
  initConfig();
  const keyring = new Keyring({ type: 'sr25519' });
  const nKeyPairs: KeyringPair[] = new Array();
  const N: number = +process.env.MEMBERSHIP_CREATION_N!;
  const paidTerms: number = +process.env.MEMBERSHIP_PAID_TERMS!;
  const nodeUrl: string = process.env.NODE_URL!;
  const sudoUri: string = process.env.SUDO_ACCOUNT_URL!;
  const defaultTimeout: number = 30000;
  let apiMethods: ApiMethods;
  let sudo: KeyringPair;
  let aKeyPair: KeyringPair;
  let membershipFee: number;
  let membershipTransactionFee: number;

  before(async function () {
    this.timeout(defaultTimeout);
    registerJoystreamTypes();
    const provider = new WsProvider(nodeUrl);
    apiMethods = await ApiMethods.create(provider);
    sudo = keyring.addFromUri(sudoUri);
    for (let i = 0; i < N; i++) {
      nKeyPairs.push(keyring.addFromUri(i.toString()));
    }
    aKeyPair = keyring.addFromUri('A');
    membershipFee = await apiMethods.getMembershipFee(paidTerms);
    membershipTransactionFee = apiMethods.estimateBuyMembershipFee(
      sudo,
      paidTerms,
      'member_name_which_is_longer_than_expected'
    );
    let nonce = await apiMethods.getNonce(sudo);
    nonce = nonce.sub(new BN(1));
    await apiMethods.transferBalanceToAccounts(sudo, nKeyPairs, membershipFee + membershipTransactionFee, nonce);
    await apiMethods.transferBalance(sudo, aKeyPair.address, membershipTransactionFee * 2);
  });

  it('Buy membeship is accepted with sufficient funds', async () => {
    await Promise.all(
      nKeyPairs.map(async keyPair => {
        await apiMethods.buyMembership(keyPair, paidTerms, 'new_member');
      })
    );
    nKeyPairs.map(keyPair =>
      apiMethods
        .getMembership(keyPair.address)
        .then(membership => assert(!membership.isEmpty, 'Account m is not a member'))
    );
  }).timeout(defaultTimeout);

  it('Accont A has insufficient funds to buy membership', async () => {
    apiMethods
      .getBalance(aKeyPair.address)
      .then(balance =>
        assert(balance.toNumber() < membershipFee, 'Account A already have sufficient balance to purchase membership')
      );
  }).timeout(defaultTimeout);

  it('Account A can not buy the membership with insufficient funds', async () => {
    await apiMethods.buyMembership(aKeyPair, paidTerms, 'late_member', true);
    apiMethods.getMembership(aKeyPair.address).then(membership => assert(membership.isEmpty, 'Account A is a member'));
  }).timeout(defaultTimeout);

  it('Account A has been provided with funds to buy the membership', async () => {
    await apiMethods.transferBalance(sudo, aKeyPair.address, membershipFee);
    apiMethods
      .getBalance(aKeyPair.address)
      .then(balance =>
        assert(balance.toNumber() >= membershipFee, 'The account balance is insufficient to purchase membership')
      );
  }).timeout(defaultTimeout);

  it('Account A was able to buy the membership', async () => {
    await apiMethods.buyMembership(aKeyPair, paidTerms, 'late_member');
    apiMethods
      .getMembership(aKeyPair.address)
      .then(membership => assert(!membership.isEmpty, 'Account A is a not member'));
  }).timeout(defaultTimeout);

  after(() => {
    apiMethods.close();
  });
});
