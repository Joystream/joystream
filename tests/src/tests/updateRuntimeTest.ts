import { initConfig } from '../utils/config';
import { Keyring, WsProvider } from '@polkadot/api';
import { Bytes } from '@polkadot/types';
import { KeyringPair } from '@polkadot/keyring/types';
import { membershipTest } from './membershipCreationTest';
import { councilTest } from './electingCouncilTest';
import { registerJoystreamTypes } from '@joystream/types';
import { ApiWrapper } from '../utils/apiWrapper';
import BN = require('bn.js');

describe('Council integration tests', () => {
  initConfig();
  const keyring = new Keyring({ type: 'sr25519' });
  const nodeUrl: string = process.env.NODE_URL!;
  const sudoUri: string = process.env.SUDO_ACCOUNT_URI!;
  const proposalStake: BN = new BN(+process.env.RUNTIME_UPGRADE_PROPOSAL_STAKE!);
  const defaultTimeout: number = 120000;

  const m1KeyPairs: KeyringPair[] = new Array();
  const m2KeyPairs: KeyringPair[] = new Array();

  let apiWrapper: ApiWrapper;
  let sudo: KeyringPair;

  before(async function () {
    this.timeout(defaultTimeout);
    registerJoystreamTypes();
    const provider = new WsProvider(nodeUrl);
    apiWrapper = await ApiWrapper.create(provider);
  });

  membershipTest(m1KeyPairs);
  membershipTest(m2KeyPairs);
  councilTest(m1KeyPairs, m2KeyPairs);

  it('Upgradeing the runtime test', async () => {
    sudo = keyring.addFromUri(sudoUri);
    const runtime: Bytes = await apiWrapper.getRuntime();
    const description: string = 'runtime upgrade proposal which is used for API integration testing';
    const runtimeProposalFee: BN = apiWrapper.estimateProposeRuntimeUpgradeFee(
      proposalStake,
      description,
      description,
      runtime
    );
    console.log('sending some funds for the test');
    const runtimeVoteFee: BN = apiWrapper.estimateVoteForProposalFee();
    await apiWrapper.transferBalance(sudo, m1KeyPairs[0].address, runtimeProposalFee.add(proposalStake));
    await apiWrapper.transferBalanceToAccounts(sudo, m2KeyPairs, runtimeVoteFee);
    console.log('going to propose runtime');
    await apiWrapper.proposeRuntime(
      m1KeyPairs[0],
      proposalStake,
      'testing runtime',
      'runtime to test proposal functionality',
      runtime
    );
    console.log('runtime proposed, approving...');
    await apiWrapper.approveProposal(m2KeyPairs[0], new BN(1));
  }).timeout(defaultTimeout);

  after(() => {
    apiWrapper.close();
  });
});
