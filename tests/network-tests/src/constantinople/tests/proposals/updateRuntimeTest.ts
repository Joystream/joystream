import { KeyringPair } from '@polkadot/keyring/types';
import { membershipTest } from '../impl/membershipCreation';
import { councilTest } from '../impl/electingCouncil';
import { updateRuntimeTest } from './impl/updateRuntime';
import tap = require('tap');

const m1Keys: KeyringPair[] = new Array();
const m2Keys: KeyringPair[] = new Array();

membershipTest(m1Keys);
membershipTest(m2Keys);
councilTest(m1Keys, m2Keys);
updateRuntimeTest(m1Keys, m2Keys);
membershipTest(new Array<KeyringPair>());

const defaultTimeout: number = 900000;
tap.setTimeout(defaultTimeout);
