import { Keyring, WsProvider } from '@polkadot/api';
import { KeyringPair } from '@polkadot/keyring/types';
import { registerJoystreamTypes } from '@constantinople/types';
import { ApiWrapper } from '../../../utils/apiWrapper';
import { v4 as uuid } from 'uuid';
import BN from 'bn.js';
import { assert } from 'chai';
import tap from 'tap';

export function workingGroupMintCapacityProposalTest(
  m1KeyPairs: KeyringPair[],
  m2KeyPairs: KeyringPair[],
  keyring: Keyring,
  nodeUrl: string,
  sudoUri: string,
  mintingCapacityIncrement: BN
) {
  let apiWrapper: ApiWrapper;
  let sudo: KeyringPair;

  tap.test('Working group mint capacity proposal test', async () => {
    registerJoystreamTypes();
    const provider = new WsProvider(nodeUrl);
    apiWrapper = await ApiWrapper.create(provider);
  });

  tap.test('Mint capacity proposal test', async () => {
    // Setup
    sudo = keyring.addFromUri(sudoUri);
    const description: string = 'spending proposal which is used for API network testing';
    const runtimeVoteFee: BN = apiWrapper.estimateVoteForProposalFee();
    const initialMintingCapacity: BN = await apiWrapper.getWorkingGroupMintCapacity();

    // Topping the balances
    const proposalStake: BN = new BN(50000);
    const runtimeProposalFee: BN = apiWrapper.estimateProposeWorkingGroupMintCapacityFee(
      description,
      description,
      proposalStake,
      initialMintingCapacity.add(mintingCapacityIncrement)
    );
    await apiWrapper.transferBalance(sudo, m1KeyPairs[0].address, runtimeProposalFee.add(proposalStake));
    await apiWrapper.transferBalanceToAccounts(sudo, m2KeyPairs, runtimeVoteFee);

    // Proposal creation
    const proposedMintingCapacity: BN = initialMintingCapacity.add(mintingCapacityIncrement);
    const proposalPromise = apiWrapper.expectProposalCreated();
    await apiWrapper.proposeWorkingGroupMintCapacity(
      m1KeyPairs[0],
      'testing mint capacity' + uuid().substring(0, 8),
      'mint capacity to test proposal functionality' + uuid().substring(0, 8),
      proposalStake,
      proposedMintingCapacity
    );
    const proposalNumber = await proposalPromise;

    // Approving mint capacity proposal
    const mintCapacityPromise = apiWrapper.expectProposalFinalized();
    await apiWrapper.batchApproveProposal(m2KeyPairs, proposalNumber);
    await mintCapacityPromise;
    const newMintingCapacity: BN = await apiWrapper.getWorkingGroupMintCapacity();
    assert(
      proposedMintingCapacity.eq(newMintingCapacity),
      `Content working group has unexpected minting capacity ${newMintingCapacity}, expected ${proposedMintingCapacity}`
    );
  });

  tap.teardown(() => {
    apiWrapper.close();
  });
}
