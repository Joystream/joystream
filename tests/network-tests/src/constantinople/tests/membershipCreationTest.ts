import { KeyringPair } from '@polkadot/keyring/types';
import { membershipTest } from './impl/membershipCreation';
import { Keyring } from '@polkadot/api';
import tap = require('tap');
import { initConfig } from '../utils/config';

initConfig();

const nKeyPairs: KeyringPair[] = new Array();

const keyring = new Keyring({ type: 'sr25519' });
const N: number = +process.env.MEMBERSHIP_CREATION_N!;
const paidTerms: number = +process.env.MEMBERSHIP_PAID_TERMS!;
const nodeUrl: string = process.env.NODE_URL!;
const sudoUri: string = process.env.SUDO_ACCOUNT_URI!;
const defaultTimeout: number = 75000;

membershipTest(nKeyPairs, keyring, N, paidTerms, nodeUrl, sudoUri);
tap.setTimeout(defaultTimeout);
