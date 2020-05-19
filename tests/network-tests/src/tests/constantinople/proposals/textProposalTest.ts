import { initConfig } from '../utils/config';
import { Keyring, WsProvider } from '@polkadot/api';
import { KeyringPair } from '@polkadot/keyring/types';
import { membershipTest } from '../membershipCreationTest';
import { councilTest } from '../electingCouncilTest';
import { registerJoystreamTypes } from '@joystream/types';
import { ApiWrapper } from '../utils/apiWrapper';
import { v4 as uuid } from 'uuid';
import BN from 'bn.js';
import tap from 'tap';

export function textProposalTest(m1KeyPairs: KeyringPair[], m2KeyPairs: KeyringPair[]) {
  initConfig();
  const keyring = new Keyring({ type: 'sr25519' });
  const nodeUrl: string = process.env.NODE_URL!;
  const sudoUri: string = process.env.SUDO_ACCOUNT_URI!;
  const defaultTimeout: number = 180000;

  let apiWrapper: ApiWrapper;
  let sudo: KeyringPair;

  tap.setTimeout(defaultTimeout);

  tap.test('Text proposal test setup', { bail: true }, async () => {
    registerJoystreamTypes();
    const provider = new WsProvider(nodeUrl);
    apiWrapper = await ApiWrapper.create(provider);
  });

  tap.test('Text proposal test', { bail: true }, async () => {
    // Setup
    sudo = keyring.addFromUri(sudoUri);
    const proposalTitle: string = 'Testing proposal ' + uuid().substring(0, 8);
    const description: string = 'Testing text proposal ' + uuid().substring(0, 8);
    const proposalText: string = 'Text of the testing proposal ' + uuid().substring(0, 8);
    const runtimeVoteFee: BN = apiWrapper.estimateVoteForProposalFee();
    await apiWrapper.transferBalanceToAccounts(sudo, m2KeyPairs, runtimeVoteFee);

    // Proposal stake calculation
    const proposalStake: BN = new BN(25000);
    const runtimeProposalFee: BN = apiWrapper.estimateProposeTextFee(
      proposalStake,
      description,
      description,
      proposalText
    );
    await apiWrapper.transferBalance(sudo, m1KeyPairs[0].address, runtimeProposalFee.add(proposalStake));

    // Proposal creation
    const proposalPromise = apiWrapper.expectProposalCreated();
    await apiWrapper.proposeText(m1KeyPairs[0], proposalStake, proposalTitle, description, proposalText);
    const proposalNumber = await proposalPromise;

    // Approving text proposal
    const textProposalPromise = apiWrapper.expectProposalFinalized();
    await apiWrapper.batchApproveProposal(m2KeyPairs, proposalNumber);
    await textProposalPromise;
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
textProposalTest(m1KeyPairs, m2KeyPairs);
