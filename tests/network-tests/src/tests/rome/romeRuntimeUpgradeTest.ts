import { initConfig } from './utils/config';
import { Keyring, WsProvider } from '@polkadot/api';
import { Bytes } from '@polkadot/types';
import { KeyringPair } from '@polkadot/keyring/types';
import { membershipTest } from './membershipCreationTest';
import { councilTest } from './electingCouncilTest';
import { registerJoystreamTypes } from '@rome/types';
import { ApiWrapper } from './utils/apiWrapper';
import BN = require('bn.js');
import { Utils } from './utils/utils';

describe('Runtime upgrade integration tests', () => {
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
  let provider: WsProvider;

  before(async function () {
    this.timeout(defaultTimeout);
    registerJoystreamTypes();
    provider = new WsProvider(nodeUrl);
    apiWrapper = await ApiWrapper.create(provider);
  });

  membershipTest(m1KeyPairs);
  membershipTest(m2KeyPairs);
  councilTest(m1KeyPairs, m2KeyPairs);

  it('Upgrading the runtime test', async () => {
    // Setup
    sudo = keyring.addFromUri(sudoUri);
    // const runtime: Bytes = await apiWrapper.getRuntime();
    const runtime: string = Utils.readRuntimeFromFile('joystream_node_runtime.wasm');
    const description: string = 'runtime upgrade proposal which is used for API integration testing';
    const runtimeProposalFee: BN = apiWrapper.estimateRomeProposeRuntimeUpgradeFee(
      proposalStake,
      description,
      description,
      runtime
    );
    const runtimeVoteFee: BN = apiWrapper.estimateVoteForRomeRuntimeProposalFee();

    // Topping the balances
    await apiWrapper.transferBalance(sudo, m1KeyPairs[0].address, runtimeProposalFee.add(proposalStake));
    await apiWrapper.transferBalanceToAccounts(sudo, m2KeyPairs, runtimeVoteFee);

    // Proposal creation
    const proposalPromise = apiWrapper.expectProposalCreated();
    await apiWrapper.proposeRuntimeRome(
      m1KeyPairs[0],
      proposalStake,
      'testing runtime',
      'runtime to test proposal functionality',
      runtime
    );
    const proposalNumber = await proposalPromise;

    // Approving runtime update proposal
    const runtimePromise = apiWrapper.expectRomeRuntimeUpgraded();
    await apiWrapper.batchApproveRomeProposal(m2KeyPairs, proposalNumber);
    // apiWrapper = await ApiWrapper.create(provider);
    await runtimePromise;

    await Utils.wait(apiWrapper.getBlockDuration().muln(2.5).toNumber());
  }).timeout(defaultTimeout);

  //membershipTest(new Array<KeyringPair>());

  after(() => {
    apiWrapper.close();
  });
});
