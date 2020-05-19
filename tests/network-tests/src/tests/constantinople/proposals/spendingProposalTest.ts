import { initConfig } from '../utils/config';
import { Keyring, WsProvider } from '@polkadot/api';
import { KeyringPair } from '@polkadot/keyring/types';
import { membershipTest } from '../membershipCreationTest';
import { councilTest } from '../electingCouncilTest';
import { registerJoystreamTypes } from '@joystream/types';
import { ApiWrapper } from '../utils/apiWrapper';
import { v4 as uuid } from 'uuid';
import BN = require('bn.js');
import { assert } from 'chai';

export function spendingProposalTest(m1KeyPairs: KeyringPair[], m2KeyPairs: KeyringPair[]) {
  initConfig();
  const keyring = new Keyring({ type: 'sr25519' });
  const nodeUrl: string = process.env.NODE_URL!;
  const sudoUri: string = process.env.SUDO_ACCOUNT_URI!;
  const spendingBalance: BN = new BN(+process.env.SPENDING_BALANCE!);
  const mintCapacity: BN = new BN(+process.env.COUNCIL_MINTING_CAPACITY!);
  const defaultTimeout: number = 120000;

  let apiWrapper: ApiWrapper;
  let sudo: KeyringPair;

  before(async function () {
    this.timeout(defaultTimeout);
    registerJoystreamTypes();
    const provider = new WsProvider(nodeUrl);
    apiWrapper = await ApiWrapper.create(provider);
  });

  it('\n\tSpending proposal test', async () => {
    // Setup
    sudo = keyring.addFromUri(sudoUri);
    const description: string = 'spending proposal which is used for API network testing with some mock data';
    const runtimeVoteFee: BN = apiWrapper.estimateVoteForProposalFee();

    // Topping the balances
    const proposalStake: BN = new BN(25000);
    const runtimeProposalFee: BN = apiWrapper.estimateProposeSpendingFee(
      description,
      description,
      proposalStake,
      spendingBalance,
      sudo.address
    );
    await apiWrapper.transferBalance(sudo, m1KeyPairs[0].address, runtimeProposalFee.add(proposalStake));
    await apiWrapper.transferBalanceToAccounts(sudo, m2KeyPairs, runtimeVoteFee);
    await apiWrapper.sudoSetCouncilMintCapacity(sudo, mintCapacity);

    // Proposal creation
    const proposalPromise = apiWrapper.expectProposalCreated();
    await apiWrapper.proposeSpending(
      m1KeyPairs[0],
      'testing spending' + uuid().substring(0, 8),
      'spending to test proposal functionality' + uuid().substring(0, 8),
      proposalStake,
      spendingBalance,
      sudo.address
    );
    const proposalNumber = await proposalPromise;

    // Approving spending proposal
    const balanceBeforeMinting: BN = await apiWrapper.getBalance(sudo.address);
    const spendingPromise = apiWrapper.expectProposalFinalized();
    await apiWrapper.batchApproveProposal(m2KeyPairs, proposalNumber);
    await spendingPromise;
    const balanceAfterMinting: BN = await apiWrapper.getBalance(sudo.address);
    assert(
      balanceAfterMinting.sub(balanceBeforeMinting).eq(spendingBalance),
      `member ${
        m1KeyPairs[0].address
      } has unexpected balance ${balanceAfterMinting}, expected ${balanceBeforeMinting.add(spendingBalance)}`
    );
  }).timeout(defaultTimeout);

  after(() => {
    apiWrapper.close();
  });
}

describe('Spending proposal network tests', () => {
  const m1KeyPairs: KeyringPair[] = new Array();
  const m2KeyPairs: KeyringPair[] = new Array();

  membershipTest(m1KeyPairs);
  membershipTest(m2KeyPairs);
  councilTest(m1KeyPairs, m2KeyPairs);
  spendingProposalTest(m1KeyPairs, m2KeyPairs);
});
