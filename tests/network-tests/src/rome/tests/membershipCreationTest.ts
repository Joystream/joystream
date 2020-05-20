import { KeyringPair } from '@polkadot/keyring/types';
import { membershipTest } from './impl/membershipCreation';

const nKeys: KeyringPair[] = new Array();

membershipTest(nKeys);
