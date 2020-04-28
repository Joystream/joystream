import { initConfig } from '../../utils/config';
import { Keyring, WsProvider } from '@polkadot/api';
import { KeyringPair } from '@polkadot/keyring/types';
import { membershipTest } from '../membershipCreationTest';
import { councilTest } from '../electingCouncilTest';
import { registerJoystreamTypes } from '@joystream/types';
import { ApiWrapper } from '../../utils/apiWrapper';
import { v4 as uuid } from 'uuid';
import BN = require('bn.js');

describe('Mint capacity proposal network tests', () => {
  initConfig();
  const keyring = new Keyring({ type: 'sr25519' });
  const nodeUrl: string = process.env.NODE_URL!;
  const sudoUri: string = process.env.SUDO_ACCOUNT_URI!;
  const mintingCapacity: BN = new BN(+process.env.MINTING_CAPACITY!);
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

  // TODO implement the test
  it('Mint capacity proposal test', async () => {
    // Setup
    sudo = keyring.addFromUri(sudoUri);
    const description: string = 'spending proposal which is used for API network testing';
    const runtimeVoteFee: BN = apiWrapper.estimateVoteForProposalFee();

    // Topping the balances
    const proposalStake: BN = await apiWrapper.getRequiredProposalStake(25, 10000);
    const runtimeProposalFee: BN = apiWrapper.estimateProposeWorkingGroupMintCapacityFee(
      description,
      description,
      proposalStake,
      mintingCapacity
    );
    await apiWrapper.transferBalance(sudo, m1KeyPairs[0].address, runtimeProposalFee.add(proposalStake));
    await apiWrapper.transferBalanceToAccounts(sudo, m2KeyPairs, runtimeVoteFee);

    // Proposal creation
    const proposalPromise = apiWrapper.expectProposalCreated();
    await apiWrapper.proposeWorkingGroupMintCapacity(
      m1KeyPairs[0],
      'testing mint capacity' + uuid().substring(0, 8),
      'mint capacity to test proposal functionality' + uuid().substring(0, 8),
      proposalStake,
      mintingCapacity
    );
    const proposalNumber = await proposalPromise;

    // Approving runtime update proposal
    const runtimePromise = apiWrapper.expectProposalFinalized();
    await apiWrapper.batchApproveProposal(m2KeyPairs, proposalNumber);
    await runtimePromise;
  }).timeout(defaultTimeout);

  after(() => {
    apiWrapper.close();
  });
});
