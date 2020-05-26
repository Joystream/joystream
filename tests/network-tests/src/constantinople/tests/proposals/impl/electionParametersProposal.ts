import { Keyring, WsProvider } from '@polkadot/api';
import { KeyringPair } from '@polkadot/keyring/types';
import { registerJoystreamTypes } from '@constantinople/types';
import { ApiWrapper } from '../../../utils/apiWrapper';
import { v4 as uuid } from 'uuid';
import BN from 'bn.js';
import { assert } from 'chai';
import tap from 'tap';

export function electionParametersProposalTest(
  m1KeyPairs: KeyringPair[],
  m2KeyPairs: KeyringPair[],
  keyring: Keyring,
  nodeUrl: string,
  sudoUri: string
) {
  let apiWrapper: ApiWrapper;
  let sudo: KeyringPair;

  tap.test('Election parameters proposal test setup', async () => {
    registerJoystreamTypes();
    const provider = new WsProvider(nodeUrl);
    apiWrapper = await ApiWrapper.create(provider);
  });

  tap.test('Election parameters proposal test', async () => {
    // Setup
    sudo = keyring.addFromUri(sudoUri);
    const proposalTitle: string = 'Testing proposal ' + uuid().substring(0, 8);
    const description: string = 'Testing validator count proposal ' + uuid().substring(0, 8);
    const runtimeVoteFee: BN = apiWrapper.estimateVoteForProposalFee();
    await apiWrapper.transferBalanceToAccounts(sudo, m2KeyPairs, runtimeVoteFee);
    const announcingPeriod: BN = await apiWrapper.getAnnouncingPeriod();
    const votingPeriod: BN = await apiWrapper.getVotingPeriod();
    const revealingPeriod: BN = await apiWrapper.getRevealingPeriod();
    const councilSize: BN = await apiWrapper.getCouncilSize();
    const candidacyLimit: BN = await apiWrapper.getCandidacyLimit();
    const newTermDuration: BN = await apiWrapper.getNewTermDuration();
    const minCouncilStake: BN = await apiWrapper.getMinCouncilStake();
    const minVotingStake: BN = await apiWrapper.getMinVotingStake();

    // Proposal stake calculation
    const proposalStake: BN = new BN(200000);
    const proposalFee: BN = apiWrapper.estimateProposeElectionParametersFee(
      description,
      description,
      proposalStake,
      announcingPeriod,
      votingPeriod,
      revealingPeriod,
      councilSize,
      candidacyLimit,
      newTermDuration,
      minCouncilStake,
      minVotingStake
    );
    await apiWrapper.transferBalance(sudo, m1KeyPairs[0].address, proposalFee.add(proposalStake));

    // Proposal creation
    const proposalPromise = apiWrapper.expectProposalCreated();
    await apiWrapper.proposeElectionParameters(
      m1KeyPairs[0],
      proposalTitle,
      description,
      proposalStake,
      announcingPeriod.subn(1),
      votingPeriod.addn(1),
      revealingPeriod.addn(1),
      councilSize.addn(1),
      candidacyLimit.addn(1),
      newTermDuration.addn(1),
      minCouncilStake.addn(1),
      minVotingStake.addn(1)
    );
    const proposalNumber = await proposalPromise;

    // Approving the proposal
    const proposalExecutionPromise = apiWrapper.expectProposalFinalized();
    await apiWrapper.batchApproveProposal(m2KeyPairs, proposalNumber);
    await proposalExecutionPromise;

    // Assertions
    const newAnnouncingPeriod: BN = await apiWrapper.getAnnouncingPeriod();
    const newVotingPeriod: BN = await apiWrapper.getVotingPeriod();
    const newRevealingPeriod: BN = await apiWrapper.getRevealingPeriod();
    const newCouncilSize: BN = await apiWrapper.getCouncilSize();
    const newCandidacyLimit: BN = await apiWrapper.getCandidacyLimit();
    const newNewTermDuration: BN = await apiWrapper.getNewTermDuration();
    const newMinCouncilStake: BN = await apiWrapper.getMinCouncilStake();
    const newMinVotingStake: BN = await apiWrapper.getMinVotingStake();
    assert(
      announcingPeriod.subn(1).eq(newAnnouncingPeriod),
      `Announcing period has unexpected value ${newAnnouncingPeriod}, expected ${announcingPeriod.subn(1)}`
    );
    assert(
      votingPeriod.addn(1).eq(newVotingPeriod),
      `Voting period has unexpected value ${newVotingPeriod}, expected ${votingPeriod.addn(1)}`
    );
    assert(
      revealingPeriod.addn(1).eq(newRevealingPeriod),
      `Revealing has unexpected value ${newRevealingPeriod}, expected ${revealingPeriod.addn(1)}`
    );
    assert(
      councilSize.addn(1).eq(newCouncilSize),
      `Council size has unexpected value ${newCouncilSize}, expected ${councilSize.addn(1)}`
    );
    assert(
      candidacyLimit.addn(1).eq(newCandidacyLimit),
      `Candidacy limit has unexpected value ${newCandidacyLimit}, expected ${candidacyLimit.addn(1)}`
    );
    assert(
      newTermDuration.addn(1).eq(newNewTermDuration),
      `New term duration has unexpected value ${newNewTermDuration}, expected ${newTermDuration.addn(1)}`
    );
    assert(
      minCouncilStake.addn(1).eq(newMinCouncilStake),
      `Min council stake has unexpected value ${newMinCouncilStake}, expected ${minCouncilStake.addn(1)}`
    );
    assert(
      minVotingStake.addn(1).eq(newMinVotingStake),
      `Min voting stake has unexpected value ${newMinVotingStake}, expected ${minVotingStake.addn(1)}`
    );
  });

  tap.teardown(() => {
    apiWrapper.close();
  });
}
