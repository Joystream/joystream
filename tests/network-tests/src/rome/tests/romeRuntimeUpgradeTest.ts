import { KeyringPair } from '@polkadot/keyring/types';
import { membershipTest } from './impl/membershipCreation';
import { councilTest } from './impl/electingCouncil';
import { romeRuntimeUpgradeTest } from './impl/romeRuntimeUpgrade';

const m1Keys: KeyringPair[] = new Array();
const m2Keys: KeyringPair[] = new Array();

membershipTest(m1Keys);
membershipTest(m2Keys);
councilTest(m1Keys, m2Keys);
romeRuntimeUpgradeTest(m1Keys, m2Keys);
