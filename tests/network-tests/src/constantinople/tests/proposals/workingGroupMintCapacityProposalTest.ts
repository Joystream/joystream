import { KeyringPair } from '@polkadot/keyring/types';
import { membershipTest } from '../impl/membershipCreation';
import { councilTest } from '../impl/electingCouncil';
import { workingGroupMintCapacityProposalTest } from './impl/workingGroupMintCapacityProposal';
import { initConfig } from '../../utils/config';
import { Keyring } from '@polkadot/api';
import BN from 'bn.js';
import tap from 'tap';

initConfig();

const m1KeyPairs: KeyringPair[] = new Array();
const m2KeyPairs: KeyringPair[] = new Array();

const keyring = new Keyring({ type: 'sr25519' });
const N: number = +process.env.MEMBERSHIP_CREATION_N!;
const paidTerms: number = +process.env.MEMBERSHIP_PAID_TERMS!;
const nodeUrl: string = process.env.NODE_URL!;
const sudoUri: string = process.env.SUDO_ACCOUNT_URI!;
const defaultTimeout: number = 600000;
const K: number = +process.env.COUNCIL_ELECTION_K!;
const greaterStake: BN = new BN(+process.env.COUNCIL_STAKE_GREATER_AMOUNT!);
const lesserStake: BN = new BN(+process.env.COUNCIL_STAKE_LESSER_AMOUNT!);
const mintingCapacityIncrement: BN = new BN(+process.env.MINTING_CAPACITY_INCREMENT!);

membershipTest(m1KeyPairs, keyring, N, paidTerms, nodeUrl, sudoUri);
membershipTest(m2KeyPairs, keyring, N, paidTerms, nodeUrl, sudoUri);
councilTest(m1KeyPairs, m2KeyPairs, keyring, K, nodeUrl, sudoUri, greaterStake, lesserStake);
workingGroupMintCapacityProposalTest(m1KeyPairs, m2KeyPairs, keyring, nodeUrl, sudoUri, mintingCapacityIncrement);
tap.setTimeout(defaultTimeout);
