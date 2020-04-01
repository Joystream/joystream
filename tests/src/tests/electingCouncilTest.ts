import { membershipTest } from './membershipCreationTest';
import { KeyringPair } from '@polkadot/keyring/types';
import { ApiWrapper } from '../utils/apiWrapper';
import { WsProvider, Keyring } from '@polkadot/api';
import { initConfig } from '../utils/config';
import BN = require('bn.js');
import { registerJoystreamTypes } from '@joystream/types';

describe('Council integration tests', () => {
  initConfig();
  const keyring = new Keyring({ type: 'sr25519' });
  const nodeUrl: string = process.env.NODE_URL!;
  const sudoUri: string = process.env.SUDO_ACCOUNT_URI!;
  const K: number = +process.env.COUNCIL_ELECTION_K!;
  const greaterStake: BN = new BN(+process.env.COUNCIL_STAKE_GREATER_AMOUNT!);
  const lesserStake: BN = new BN(+process.env.COUNCIL_STAKE_LESSER_AMOUNT!);
  const defaultTimeout: number = 30000;
  let sudo: KeyringPair;
  let apiWrapper: ApiWrapper;
  let m1KeyPairs: KeyringPair[] = new Array();
  let m2KeyPairs: KeyringPair[] = new Array();

  before(async function () {
    this.timeout(defaultTimeout);
    registerJoystreamTypes();
    m1KeyPairs = membershipTest();
    m2KeyPairs = membershipTest();
    const provider = new WsProvider(nodeUrl);
    apiWrapper = await ApiWrapper.create(provider);
    sudo = keyring.addFromUri(sudoUri);
    const applyForCouncilFee: BN = apiWrapper.estimateApplyForCouncilFee(greaterStake);
    await apiWrapper.transferBalanceToAccounts(sudo, m2KeyPairs, applyForCouncilFee);
  });

  it('Electing a council test', async () => {
    apiWrapper.batchApplyForCouncilElection(m2KeyPairs.slice(0, K), greaterStake);
    apiWrapper.batchApplyForCouncilElection(m2KeyPairs.slice(K), lesserStake);
  });
});
