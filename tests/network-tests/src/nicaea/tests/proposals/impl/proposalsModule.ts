import { KeyringPair } from '@polkadot/keyring/types'
import { ApiWrapper, WorkingGroups } from '../../../utils/apiWrapper'
import { v4 as uuid } from 'uuid'
import BN from 'bn.js'
import { WorkingGroupOpening } from '../../../dto/workingGroupOpening'
import { FillOpeningParameters } from '../../../dto/fillOpeningParameters'

export async function createWorkingGroupLeaderOpening(
  apiWrapper: ApiWrapper,
  m1KeyPairs: KeyringPair[],
  sudo: KeyringPair,
  applicationStake: BN,
  roleStake: BN,
  workingGroup: string
): Promise<BN> {
  // Setup
  const proposalTitle: string = 'Testing proposal ' + uuid().substring(0, 8)
  const description: string = 'Testing working group lead opening proposal ' + uuid().substring(0, 8)

  // Proposal stake calculation
  const proposalStake: BN = new BN(100000)
  const proposalFee: BN = apiWrapper.estimateProposeCreateWorkingGroupLeaderOpeningFee()
  await apiWrapper.transferBalance(sudo, m1KeyPairs[0].address, proposalFee.add(proposalStake))

  // Opening construction
  const opening = new WorkingGroupOpening()
    .setMaxActiveApplicants(new BN(m1KeyPairs.length))
    .setMaxReviewPeriodLength(new BN(32))
    .setApplicationStakingPolicyAmount(new BN(applicationStake))
    .setApplicationCrowdedOutUnstakingPeriodLength(new BN(1))
    .setApplicationExpiredUnstakingPeriodLength(new BN(1))
    .setRoleStakingPolicyAmount(new BN(roleStake))
    .setRoleCrowdedOutUnstakingPeriodLength(new BN(1))
    .setRoleExpiredUnstakingPeriodLength(new BN(1))
    .setSlashableMaxCount(new BN(1))
    .setSlashableMaxPercentPtsPerTime(new BN(100))
    .setSuccessfulApplicantApplicationStakeUnstakingPeriod(new BN(1))
    .setFailedApplicantApplicationStakeUnstakingPeriod(new BN(1))
    .setFailedApplicantRoleStakeUnstakingPeriod(new BN(1))
    .setTerminateApplicationStakeUnstakingPeriod(new BN(1))
    .setTerminateRoleStakeUnstakingPeriod(new BN(1))
    .setExitRoleApplicationStakeUnstakingPeriod(new BN(1))
    .setExitRoleStakeUnstakingPeriod(new BN(1))
    .setText(uuid().substring(0, 8))

  // Proposal creation
  const proposalPromise = apiWrapper.expectProposalCreated()
  await apiWrapper.proposeCreateWorkingGroupLeaderOpening(
    m1KeyPairs[0],
    proposalTitle,
    description,
    proposalStake,
    opening,
    workingGroup
  )
  const proposalNumber: BN = await proposalPromise
  return proposalNumber
}

export async function beginWorkingGroupLeaderApplicationReview(
  apiWrapper: ApiWrapper,
  m1KeyPairs: KeyringPair[],
  sudo: KeyringPair,
  openingId: BN,
  workingGroup: string
): Promise<BN> {
  // Setup
  const proposalTitle: string = 'Testing proposal ' + uuid().substring(0, 8)
  const description: string = 'Testing begin working group lead application review proposal ' + uuid().substring(0, 8)

  // Proposal stake calculation
  const proposalStake: BN = new BN(25000)
  const proposalFee: BN = apiWrapper.estimateProposeBeginWorkingGroupLeaderApplicationReviewFee()
  await apiWrapper.transferBalance(sudo, m1KeyPairs[0].address, proposalFee.add(proposalStake))

  // Proposal creation
  const proposalPromise = apiWrapper.expectProposalCreated()
  await apiWrapper.proposeBeginWorkingGroupLeaderApplicationReview(
    m1KeyPairs[0],
    proposalTitle,
    description,
    proposalStake,
    openingId,
    workingGroup
  )
  const proposalNumber: BN = await proposalPromise
  return proposalNumber
}

export async function fillLeaderOpeningProposal(
  apiWrapper: ApiWrapper,
  m1KeyPairs: KeyringPair[],
  applicantRoleAccountAddress: string,
  sudo: KeyringPair,
  firstRewardInterval: BN,
  rewardInterval: BN,
  payoutAmount: BN,
  openingId: BN,
  workingGroup: WorkingGroups
): Promise<BN> {
  // Setup
  const proposalTitle: string = 'Testing proposal ' + uuid().substring(0, 8)
  const description: string = 'Testing fill opening proposal ' + uuid().substring(0, 8)
  const workingGroupString: string = apiWrapper.getWorkingGroupString(workingGroup)

  // Proposal stake calculation
  const proposalStake: BN = new BN(50000)
  const proposalFee: BN = apiWrapper.estimateProposeFillLeaderOpeningFee()
  await apiWrapper.transferBalance(sudo, m1KeyPairs[0].address, proposalFee.add(proposalStake))

  // Proposal creation
  const applicationId: BN = (
    await apiWrapper.getActiveApplicationsIdsByRoleAccount(applicantRoleAccountAddress, workingGroup)
  )[0]
  const now = await apiWrapper.getBestBlock()
  const fillOpeningParameters: FillOpeningParameters = new FillOpeningParameters()
    .setAmountPerPayout(payoutAmount)
    .setNextPaymentAtBlock(now.add(firstRewardInterval))
    .setPayoutInterval(rewardInterval)
    .setOpeningId(openingId)
    .setSuccessfulApplicationId(applicationId)
    .setWorkingGroup(workingGroupString)

  const proposalPromise = apiWrapper.expectProposalCreated()
  await apiWrapper.proposeFillLeaderOpening(
    m1KeyPairs[0],
    proposalTitle,
    description,
    proposalStake,
    fillOpeningParameters
  )
  const proposalNumber: BN = await proposalPromise
  return proposalNumber
}

export async function terminateLeaderRoleProposal(
  apiWrapper: ApiWrapper,
  m1KeyPairs: KeyringPair[],
  leaderRoleAccountAddress: string,
  sudo: KeyringPair,
  slash: boolean,
  workingGroup: WorkingGroups
) {
  // Setup
  const proposalTitle: string = 'Testing proposal ' + uuid().substring(0, 8)
  const description: string = 'Testing begin working group lead application review proposal ' + uuid().substring(0, 8)
  const rationale: string = 'Testing leader termination ' + uuid().substring(0, 8)
  const workingGroupString: string = apiWrapper.getWorkingGroupString(workingGroup)
  const workerId: BN = await apiWrapper.getWorkerIdByRoleAccount(leaderRoleAccountAddress, workingGroup)

  // Proposal stake calculation
  const proposalStake: BN = new BN(100000)
  const proposalFee: BN = apiWrapper.estimateProposeTerminateLeaderRoleFee()
  await apiWrapper.transferBalance(sudo, m1KeyPairs[0].address, proposalFee.add(proposalStake))

  // Proposal creation
  const proposalPromise = apiWrapper.expectProposalCreated()
  await apiWrapper.proposeTerminateLeaderRole(
    m1KeyPairs[0],
    proposalTitle,
    description,
    proposalStake,
    workerId,
    rationale,
    slash,
    workingGroupString
  )
  const proposalNumber: BN = await proposalPromise
  return proposalNumber
}

export async function setLeaderRewardProposal(
  apiWrapper: ApiWrapper,
  m1KeyPairs: KeyringPair[],
  sudo: KeyringPair,
  payoutAmount: BN,
  workingGroup: WorkingGroups
): Promise<BN> {
  // Setup
  const proposalTitle: string = 'Testing proposal ' + uuid().substring(0, 8)
  const description: string = 'Testing set leader reward proposal ' + uuid().substring(0, 8)
  const workingGroupString: string = apiWrapper.getWorkingGroupString(workingGroup)
  const workerId: BN = (await apiWrapper.getLeadWorkerId(workingGroup))!

  // Proposal stake calculation
  const proposalStake: BN = new BN(50000)
  const proposalFee: BN = apiWrapper.estimateProposeLeaderRewardFee()
  await apiWrapper.transferBalance(sudo, m1KeyPairs[0].address, proposalFee.add(proposalStake))

  // Proposal creation
  const proposalPromise = apiWrapper.expectProposalCreated()
  await apiWrapper.proposeLeaderReward(
    m1KeyPairs[0],
    proposalTitle,
    description,
    proposalStake,
    workerId,
    payoutAmount,
    workingGroupString
  )
  const proposalNumber: BN = await proposalPromise
  return proposalNumber
}

export async function decreaseLeaderStakeProposal(
  apiWrapper: ApiWrapper,
  m1KeyPairs: KeyringPair[],
  sudo: KeyringPair,
  stakeDecrement: BN,
  workingGroup: WorkingGroups
): Promise<BN> {
  // Setup
  const proposalTitle: string = 'Testing proposal ' + uuid().substring(0, 8)
  const description: string = 'Testing decrease leader stake proposal ' + uuid().substring(0, 8)
  const workingGroupString: string = apiWrapper.getWorkingGroupString(workingGroup)
  const workerId: BN = (await apiWrapper.getLeadWorkerId(workingGroup))!

  // Proposal stake calculation
  const proposalStake: BN = new BN(50000)
  const proposalFee: BN = apiWrapper.estimateProposeDecreaseLeaderStakeFee()
  await apiWrapper.transferBalance(sudo, m1KeyPairs[0].address, proposalFee.add(proposalStake))

  // Proposal creation
  const proposalPromise = apiWrapper.expectProposalCreated()
  await apiWrapper.proposeDecreaseLeaderStake(
    m1KeyPairs[0],
    proposalTitle,
    description,
    proposalStake,
    workerId,
    stakeDecrement,
    workingGroupString
  )
  const proposalNumber: BN = await proposalPromise
  return proposalNumber
}

export async function slashLeaderProposal(
  apiWrapper: ApiWrapper,
  m1KeyPairs: KeyringPair[],
  sudo: KeyringPair,
  slashAmount: BN,
  workingGroup: WorkingGroups
): Promise<BN> {
  // Setup
  const proposalTitle: string = 'Testing proposal ' + uuid().substring(0, 8)
  const description: string = 'Testing slash leader stake proposal ' + uuid().substring(0, 8)
  const workingGroupString: string = apiWrapper.getWorkingGroupString(workingGroup)
  const workerId: BN = (await apiWrapper.getLeadWorkerId(workingGroup))!

  // Proposal stake calculation
  const proposalStake: BN = new BN(50000)
  const proposalFee: BN = apiWrapper.estimateProposeSlashLeaderStakeFee()
  await apiWrapper.transferBalance(sudo, m1KeyPairs[0].address, proposalFee.add(proposalStake))

  // Proposal creation
  const proposalPromise = apiWrapper.expectProposalCreated()
  await apiWrapper.proposeSlashLeaderStake(
    m1KeyPairs[0],
    proposalTitle,
    description,
    proposalStake,
    workerId,
    slashAmount,
    workingGroupString
  )
  const proposalNumber: BN = await proposalPromise
  return proposalNumber
}

export async function workingGroupMintCapacityProposal(
  apiWrapper: ApiWrapper,
  m1KeyPairs: KeyringPair[],
  sudo: KeyringPair,
  mintCapacity: BN,
  workingGroup: WorkingGroups
): Promise<BN> {
  // Setup
  const proposalTitle: string = 'Testing proposal ' + uuid().substring(0, 8)
  const description: string = 'Testing working group mint capacity proposal ' + uuid().substring(0, 8)
  const workingGroupString: string = apiWrapper.getWorkingGroupString(workingGroup)

  // Proposal stake calculation
  const proposalStake: BN = new BN(50000)
  const proposalFee: BN = apiWrapper.estimateProposeWorkingGroupMintCapacityFee()
  await apiWrapper.transferBalance(sudo, m1KeyPairs[0].address, proposalFee.add(proposalStake))

  // Proposal creation
  const proposalPromise = apiWrapper.expectProposalCreated()
  await apiWrapper.proposeWorkingGroupMintCapacity(
    m1KeyPairs[0],
    proposalTitle,
    description,
    proposalStake,
    mintCapacity,
    workingGroupString
  )
  const proposalNumber: BN = await proposalPromise
  return proposalNumber
}

export async function voteForProposal(
  apiWrapper: ApiWrapper,
  m2KeyPairs: KeyringPair[],
  sudo: KeyringPair,
  proposalNumber: BN
): Promise<void> {
  const proposalVoteFee: BN = apiWrapper.estimateVoteForProposalFee()
  await apiWrapper.transferBalanceToAccounts(sudo, m2KeyPairs, proposalVoteFee)

  // Approving the proposal
  const proposalExecutionPromise = apiWrapper.expectProposalFinalized()
  await apiWrapper.batchApproveProposal(m2KeyPairs, proposalNumber)
  await proposalExecutionPromise
}
