import { Keyring, WsProvider } from '@polkadot/api';
import { KeyringPair } from '@polkadot/keyring/types';
import { registerJoystreamTypes } from '@constantinople/types';
import { ApiWrapper } from '../../../utils/apiWrapper';
import { v4 as uuid } from 'uuid';
import BN from 'bn.js';
import { assert } from 'chai';
import tap from 'tap';

export function validatorCountProposal(
  m1KeyPairs: KeyringPair[],
  m2KeyPairs: KeyringPair[],
  keyring: Keyring,
  nodeUrl: string,
  sudoUri: string,
  validatorCountIncrement: BN
) {
  let apiWrapper: ApiWrapper;
  let sudo: KeyringPair;

  tap.test('Validator count proposal test setup', async () => {
    registerJoystreamTypes();
    const provider = new WsProvider(nodeUrl);
    apiWrapper = await ApiWrapper.create(provider);
  });

  tap.test('Validator count proposal test', async () => {
    // Setup
    sudo = keyring.addFromUri(sudoUri);
    const proposalTitle: string = 'Testing proposal ' + uuid().substring(0, 8);
    const description: string = 'Testing validator count proposal ' + uuid().substring(0, 8);
    const runtimeVoteFee: BN = apiWrapper.estimateVoteForProposalFee();
    await apiWrapper.transferBalanceToAccounts(sudo, m2KeyPairs, runtimeVoteFee);

    // Proposal stake calculation
    const proposalStake: BN = new BN(100000);
    const proposalFee: BN = apiWrapper.estimateProposeValidatorCountFee(description, description, proposalStake);
    await apiWrapper.transferBalance(sudo, m1KeyPairs[0].address, proposalFee.add(proposalStake));
    const validatorCount: BN = await apiWrapper.getValidatorCount();

    // Proposal creation
    const proposalPromise = apiWrapper.expectProposalCreated();
    await apiWrapper.proposeValidatorCount(
      m1KeyPairs[0],
      proposalTitle,
      description,
      proposalStake,
      validatorCount.add(validatorCountIncrement)
    );
    const proposalNumber = await proposalPromise;

    // Approving the proposal
    const proposalExecutionPromise = apiWrapper.expectProposalFinalized();
    await apiWrapper.batchApproveProposal(m2KeyPairs, proposalNumber);
    await proposalExecutionPromise;
    const newValidatorCount: BN = await apiWrapper.getValidatorCount();
    assert(
      newValidatorCount.sub(validatorCount).eq(validatorCountIncrement),
      `Validator count has unexpeccted value ${newValidatorCount}, expected ${validatorCount.add(
        validatorCountIncrement
      )}`
    );
  });

  tap.teardown(() => {
    apiWrapper.close();
  });
}
