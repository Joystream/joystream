import { initConfig } from './utils/config';
import { Keyring, WsProvider } from '@polkadot/api';
import { KeyringPair } from '@polkadot/keyring/types';
import { membershipTest } from './membershipCreationTest';
import { councilTest } from './electingCouncilTest';
import { registerJoystreamTypes } from '@rome/types';
import { ApiWrapper } from './utils/apiWrapper';
import BN from 'bn.js';
import { Utils } from './utils/utils';
import tap from 'tap';

export function romeRuntimeUpgradeTest(m1KeyPairs: KeyringPair[], m2KeyPairs: KeyringPair[]) {
  initConfig();
  const keyring = new Keyring({ type: 'sr25519' });
  const nodeUrl: string = process.env.NODE_URL!;
  const sudoUri: string = process.env.SUDO_ACCOUNT_URI!;
  const proposalStake: BN = new BN(+process.env.RUNTIME_UPGRADE_PROPOSAL_STAKE!);
  const runtimePath: string = process.env.RUNTIME_WASM_PATH!;
  const defaultTimeout: number = 1200000;

  let apiWrapper: ApiWrapper;
  let sudo: KeyringPair;
  let provider: WsProvider;

  tap.setTimeout(defaultTimeout);

  tap.test('Rome runtime upgrade test setup', async () => {
    registerJoystreamTypes();
    provider = new WsProvider(nodeUrl);
    apiWrapper = await ApiWrapper.create(provider);
  });

  tap.test('Upgrading the runtime test', async () => {
    // Setup
    sudo = keyring.addFromUri(sudoUri);
    const runtime: string = Utils.readRuntimeFromFile(runtimePath);
    const description: string = 'runtime upgrade proposal which is used for API integration testing';
    const runtimeProposalFee: BN = apiWrapper.estimateProposeRuntimeUpgradeFee(
      proposalStake,
      description,
      description,
      runtime
    );
    const runtimeVoteFee: BN = apiWrapper.estimateVoteForRuntimeProposalFee();

    // Topping the balances
    await apiWrapper.transferBalance(sudo, m1KeyPairs[0].address, runtimeProposalFee.add(proposalStake));
    await apiWrapper.transferBalanceToAccounts(sudo, m2KeyPairs, runtimeVoteFee);

    // Proposal creation
    const proposalPromise = apiWrapper.expectProposalCreated();
    await apiWrapper.proposeRuntime(
      m1KeyPairs[0],
      proposalStake,
      'testing runtime',
      'runtime to test proposal functionality',
      runtime
    );
    const proposalNumber = await proposalPromise;

    // Approving runtime update proposal
    const runtimePromise = apiWrapper.expectRuntimeUpgraded();
    await apiWrapper.batchApproveProposal(m2KeyPairs, proposalNumber);
    await runtimePromise;
  });

  tap.teardown(() => {
    apiWrapper.close();
  });
}

const m1Keys: KeyringPair[] = new Array();
const m2Keys: KeyringPair[] = new Array();

membershipTest(m1Keys);
membershipTest(m2Keys);
councilTest(m1Keys, m2Keys);
romeRuntimeUpgradeTest(m1Keys, m2Keys);
