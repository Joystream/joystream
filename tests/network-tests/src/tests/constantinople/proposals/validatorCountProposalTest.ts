import { initConfig } from '../utils/config';
import { Keyring, WsProvider } from '@polkadot/api';
import { KeyringPair } from '@polkadot/keyring/types';
import { membershipTest } from '../membershipCreationTest';
import { councilTest } from '../electingCouncilTest';
import { registerJoystreamTypes } from '@joystream/types';
import { ApiWrapper } from '../utils/apiWrapper';
import { v4 as uuid } from 'uuid';
import BN from 'bn.js';
import { assert } from 'chai';
import tap from 'tap';

export function validatorCountProposal(m1KeyPairs: KeyringPair[], m2KeyPairs: KeyringPair[]) {
  initConfig();
  const keyring = new Keyring({ type: 'sr25519' });
  const nodeUrl: string = process.env.NODE_URL!;
  const sudoUri: string = process.env.SUDO_ACCOUNT_URI!;
  const validatorCountIncrement: BN = new BN(+process.env.VALIDATOR_COUNT_INCREMENT!);
  const defaultTimeout: number = 600000;

  let apiWrapper: ApiWrapper;
  let sudo: KeyringPair;

  tap.setTimeout(defaultTimeout);

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

const m1Keys: KeyringPair[] = new Array();
const m2Keys: KeyringPair[] = new Array();

membershipTest(m1Keys);
membershipTest(m2Keys);
councilTest(m1Keys, m2Keys);
validatorCountProposal(m1Keys, m2Keys);
