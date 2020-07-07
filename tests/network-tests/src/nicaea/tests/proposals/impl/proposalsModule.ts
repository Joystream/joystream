import { KeyringPair } from '@polkadot/keyring/types';
import { ApiWrapper, WorkingGroups } from '../../../utils/apiWrapper';
import { v4 as uuid } from 'uuid';
import BN from 'bn.js';
import { assert } from 'chai';

export async function createWorkingGroupLeaderOpening(
  apiWrapper: ApiWrapper,
  m1KeyPairs: KeyringPair[],
  sudo: KeyringPair,
  applicationStake: BN,
  roleStake: BN
): Promise<BN> {
  // Setup
  const proposalTitle: string = 'Testing proposal ' + uuid().substring(0, 8);
  const description: string = 'Testing working group lead opening proposal ' + uuid().substring(0, 8);

  // Proposal stake calculation
  const proposalStake: BN = new BN(100000);
  const proposalFee: BN = apiWrapper.estimateProposeCreateWorkingGroupLeaderOpening();
  await apiWrapper.transferBalance(sudo, m1KeyPairs[0].address, proposalFee.add(proposalStake));

  // Proposal creation
  const proposalPromise = apiWrapper.expectProposalCreated();
  await apiWrapper.proposeCreateWorkingGroupLeaderOpening(
    m1KeyPairs[0],
    proposalTitle,
    description,
    proposalStake,
    await apiWrapper.getBestBlock(),
    new BN(32),
    new BN(32),
    new BN(applicationStake),
    new BN(0),
    new BN(0),
    new BN(roleStake),
    new BN(0),
    new BN(0),
    new BN(1),
    new BN(100),
    new BN(1),
    new BN(1),
    new BN(1),
    new BN(1),
    new BN(1),
    new BN(1),
    new BN(1),
    uuid().substring(0, 8)
  );
  const proposalNumber: BN = await proposalPromise;
  return proposalNumber;
}

export async function beginWorkingGroupLeaderApplicationReview(
  apiWrapper: ApiWrapper,
  m1KeyPairs: KeyringPair[],
  sudo: KeyringPair,
  openingId: BN,
  workingGroup: string
) {
  // Setup
  const proposalTitle: string = 'Testing proposal ' + uuid().substring(0, 8);
  const description: string = 'Testing begin working group lead application review proposal ' + uuid().substring(0, 8);

  // Proposal stake calculation
  const proposalStake: BN = new BN(100000);
  const proposalFee: BN = apiWrapper.estimateProposeBeginWorkingGroupLeaderApplicationReview();
  await apiWrapper.transferBalance(sudo, m1KeyPairs[0].address, proposalFee.add(proposalStake));

  // Proposal creation
  const proposalPromise = apiWrapper.expectProposalCreated();
  await apiWrapper.proposeBeginWorkingGroupLeaderApplicationReview(
    m1KeyPairs[0],
    proposalTitle,
    description,
    proposalStake,
    openingId,
    workingGroup
  );
  const proposalNumber: BN = await proposalPromise;
  return proposalNumber;
}

export async function voteForProposal(
  apiWrapper: ApiWrapper,
  m2KeyPairs: KeyringPair[],
  sudo: KeyringPair,
  proposalNumber: BN
) {
  const proposalVoteFee: BN = apiWrapper.estimateVoteForProposalFee();
  await apiWrapper.transferBalanceToAccounts(sudo, m2KeyPairs, proposalVoteFee);

  // Approving the proposal
  const proposalExecutionPromise = apiWrapper.expectProposalFinalized();
  await apiWrapper.batchApproveProposal(m2KeyPairs, proposalNumber);
  await proposalExecutionPromise;
}

export async function ensureLeadOpeningCreated(apiWrapper: ApiWrapper, m1KeyPairs: KeyringPair[], sudo: KeyringPair) {
  // Assertions
  //   const opening = apiWrapper.getApplicationById();
  //   const newLead: string = await apiWrapper.getCurrentLeadAddress();
  //   assert(
  //     newLead === m1KeyPairs[1].address,
  //     `New lead has unexpected value ${newLead}, expected ${m1KeyPairs[1].address}`
  //   );
}
