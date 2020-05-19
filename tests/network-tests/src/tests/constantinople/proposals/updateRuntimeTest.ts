import { initConfig } from '../utils/config';
import { Keyring, WsProvider } from '@polkadot/api';
import { Bytes } from '@polkadot/types';
import { KeyringPair } from '@polkadot/keyring/types';
import { membershipTest } from '../membershipCreationTest';
import { councilTest } from '../electingCouncilTest';
import { registerJoystreamTypes } from '@joystream/types';
import { ApiWrapper } from '../utils/apiWrapper';
import { v4 as uuid } from 'uuid';
import BN from 'bn.js';
import tap from 'tap';

export function updateRuntimeTest(m1KeyPairs: KeyringPair[], m2KeyPairs: KeyringPair[]) {
  initConfig();
  const keyring = new Keyring({ type: 'sr25519' });
  const nodeUrl: string = process.env.NODE_URL!;
  const sudoUri: string = process.env.SUDO_ACCOUNT_URI!;
  const defaultTimeout: number = 120000;

  let apiWrapper: ApiWrapper;
  let sudo: KeyringPair;

  tap.setTimeout(defaultTimeout);

  tap.test('Update runtime test setup', { bail: true }, async () => {
    registerJoystreamTypes();
    const provider = new WsProvider(nodeUrl);
    apiWrapper = await ApiWrapper.create(provider);
  });

  tap.test('\n\tUpgrading the runtime test', { bail: true }, async () => {
    // Setup
    sudo = keyring.addFromUri(sudoUri);
    const runtime: Bytes = await apiWrapper.getRuntime();
    const description: string = 'runtime upgrade proposal which is used for API network testing';
    const runtimeVoteFee: BN = apiWrapper.estimateVoteForProposalFee();

    // Topping the balances
    const proposalStake: BN = new BN(1000000);
    const runtimeProposalFee: BN = apiWrapper.estimateProposeRuntimeUpgradeFee(
      proposalStake,
      description,
      description,
      runtime
    );
    await apiWrapper.transferBalance(sudo, m1KeyPairs[0].address, runtimeProposalFee.add(proposalStake));
    await apiWrapper.transferBalanceToAccounts(sudo, m2KeyPairs, runtimeVoteFee);

    // Proposal creation
    const proposalPromise = apiWrapper.expectProposalCreated();
    await apiWrapper.proposeRuntime(
      m1KeyPairs[0],
      proposalStake,
      'testing runtime' + uuid().substring(0, 8),
      'runtime to test proposal functionality' + uuid().substring(0, 8),
      runtime
    );
    const proposalNumber = await proposalPromise;

    // Approving runtime update proposal
    const runtimePromise = apiWrapper.expectProposalFinalized();
    await apiWrapper.batchApproveProposal(m2KeyPairs, proposalNumber);
    await runtimePromise;
  });

  tap.teardown(() => {
    apiWrapper.close();
  });
}

const m1KeyPairs: KeyringPair[] = new Array();
const m2KeyPairs: KeyringPair[] = new Array();

membershipTest(m1KeyPairs);
membershipTest(m2KeyPairs);
councilTest(m1KeyPairs, m2KeyPairs);
updateRuntimeTest(m1KeyPairs, m2KeyPairs);
membershipTest(new Array<KeyringPair>());
