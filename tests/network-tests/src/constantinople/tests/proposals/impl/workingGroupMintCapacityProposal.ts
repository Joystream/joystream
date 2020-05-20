import { initConfig } from '../../../utils/config';
import { Keyring, WsProvider } from '@polkadot/api';
import { KeyringPair } from '@polkadot/keyring/types';
import { registerJoystreamTypes } from '@constantinople/types';
import { ApiWrapper } from '../../../utils/apiWrapper';
import { v4 as uuid } from 'uuid';
import BN from 'bn.js';
import { assert } from 'chai';
import tap from 'tap';

export function workingGroupMintCapacityProposalTest(m1KeyPairs: KeyringPair[], m2KeyPairs: KeyringPair[]) {
  initConfig();
  const keyring = new Keyring({ type: 'sr25519' });
  const nodeUrl: string = process.env.NODE_URL!;
  const sudoUri: string = process.env.SUDO_ACCOUNT_URI!;
  const mintingCapacityIncrement: BN = new BN(+process.env.MINTING_CAPACITY_INCREMENT!);
  const defaultTimeout: number = 600000;

  let apiWrapper: ApiWrapper;
  let sudo: KeyringPair;

  tap.setTimeout(defaultTimeout);

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
    const proposalPromise = apiWrapper.expectProposalCreated();
    await apiWrapper.proposeWorkingGroupMintCapacity(
      m1KeyPairs[0],
      'testing mint capacity' + uuid().substring(0, 8),
      'mint capacity to test proposal functionality' + uuid().substring(0, 8),
      proposalStake,
      initialMintingCapacity.add(mintingCapacityIncrement)
    );
    const proposalNumber = await proposalPromise;

    // Approving mint capacity proposal
    const mintCapacityPromise = apiWrapper.expectProposalFinalized();
    await apiWrapper.batchApproveProposal(m2KeyPairs, proposalNumber);
    await mintCapacityPromise;
    const updatedMintingCapacity: BN = await apiWrapper.getWorkingGroupMintCapacity();
    assert(
      updatedMintingCapacity.sub(initialMintingCapacity).eq(mintingCapacityIncrement),
      `Content working group has unexpected minting capacity ${updatedMintingCapacity}, expected ${initialMintingCapacity.add(
        mintingCapacityIncrement
      )}`
    );
  });

  tap.teardown(() => {
    apiWrapper.close();
  });
}
