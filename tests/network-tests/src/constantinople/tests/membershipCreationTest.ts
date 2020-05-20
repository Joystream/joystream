import { KeyringPair } from '@polkadot/keyring/types';
import { membershipTest } from './impl/membershipCreation';

const nKeyPairs: KeyringPair[] = new Array();

membershipTest(nKeyPairs);
