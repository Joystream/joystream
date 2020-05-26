import { KeyringPair } from '@polkadot/keyring/types';
import { membershipTest } from './impl/membershipCreation';
import { councilTest } from './impl/electingCouncil';
import { initConfig } from '../utils/config';
import { Keyring } from '@polkadot/api';
import tap from 'tap';
import BN from 'bn.js';

initConfig();

const m1KeyPairs: KeyringPair[] = new Array();
const m2KeyPairs: KeyringPair[] = new Array();

const keyring = new Keyring({ type: 'sr25519' });
const N: number = +process.env.MEMBERSHIP_CREATION_N!;
const paidTerms: number = +process.env.MEMBERSHIP_PAID_TERMS!;
const nodeUrl: string = process.env.NODE_URL!;
const sudoUri: string = process.env.SUDO_ACCOUNT_URI!;
const defaultTimeout: number = 300000;
const K: number = +process.env.COUNCIL_ELECTION_K!;
const greaterStake: BN = new BN(+process.env.COUNCIL_STAKE_GREATER_AMOUNT!);
const lesserStake: BN = new BN(+process.env.COUNCIL_STAKE_LESSER_AMOUNT!);

membershipTest(m1KeyPairs, keyring, N, paidTerms, nodeUrl, sudoUri);
membershipTest(m2KeyPairs, keyring, N, paidTerms, nodeUrl, sudoUri);
councilTest(m1KeyPairs, m2KeyPairs, keyring, K, nodeUrl, sudoUri, greaterStake, lesserStake);
tap.setTimeout(defaultTimeout);
