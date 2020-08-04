import { KeyringPair } from '@polkadot/keyring/types'
import { ApiWrapper, WorkingGroups } from '../../utils/apiWrapper'
import { v4 as uuid } from 'uuid'
import BN from 'bn.js'
import { FillOpeningParameters, ProposalId } from '@nicaea/types/proposals'
import { Fixture } from './interfaces/fixture'
import { Bytes, Option, u32 } from '@polkadot/types'
import { Balance, BlockNumber } from '@polkadot/types/interfaces'
import { assert } from 'chai'
import {
  ActivateOpeningAt,
  ApplicationId,
  ApplicationRationingPolicy,
  OpeningId,
  StakingPolicy,
} from '@nicaea/types/hiring'
import { RewardPolicy, SlashingTerms, WorkerId, WorkingGroupOpeningPolicyCommitment } from '@nicaea/types/working-group'
import { WorkingGroup } from '@nicaea/types/common'

export class CreateWorkingGroupLeaderOpeningFixture implements Fixture {
  private apiWrapper: ApiWrapper
  private m1KeyPairs: KeyringPair[]
  private sudo: KeyringPair
  private applicationStake: BN
  private roleStake: BN
  private workingGroup: string

  private result: ProposalId | undefined

  constructor(
    apiWrapper: ApiWrapper,
    m1KeyPairs: KeyringPair[],
    sudo: KeyringPair,
    applicationStake: BN,
    roleStake: BN,
    workingGroup: string
  ) {
    this.apiWrapper = apiWrapper
    this.m1KeyPairs = m1KeyPairs
    this.sudo = sudo
    this.applicationStake = applicationStake
    this.roleStake = roleStake
    this.workingGroup = workingGroup
  }

  public getResult(): ProposalId | undefined {
    return this.result
  }

  public async runner(expectFailure: boolean): Promise<void> {
    // Setup
    const proposalTitle: string = 'Testing proposal ' + uuid().substring(0, 8)
    const description: string = 'Testing working group lead opening proposal ' + uuid().substring(0, 8)

    // Proposal stake calculation
    const proposalStake: BN = new BN(100000)
    const proposalFee: BN = this.apiWrapper.estimateProposeCreateWorkingGroupLeaderOpeningFee()
    await this.apiWrapper.transferBalance(this.sudo, this.m1KeyPairs[0].address, proposalFee.add(proposalStake))

    // Opening construction
    const activateAtBlock: ActivateOpeningAt = new ActivateOpeningAt('CurrentBlock')
    const commitment: WorkingGroupOpeningPolicyCommitment = new WorkingGroupOpeningPolicyCommitment({
      application_rationing_policy: new Option(ApplicationRationingPolicy, {
        max_active_applicants: new BN(this.m1KeyPairs.length) as u32,
      }),
      max_review_period_length: new BN(32) as u32,
      application_staking_policy: new Option(StakingPolicy, {
        amount: this.applicationStake,
        amount_mode: 'AtLeast',
        crowded_out_unstaking_period_length: new BN(1),
        review_period_expired_unstaking_period_length: new BN(1),
      }),
      role_staking_policy: new Option(StakingPolicy, {
        amount: this.roleStake,
        amount_mode: 'AtLeast',
        crowded_out_unstaking_period_length: new BN(1),
        review_period_expired_unstaking_period_length: new BN(1),
      }),
      role_slashing_terms: new SlashingTerms({
        Slashable: {
          max_count: new BN(1),
          max_percent_pts_per_time: new BN(100),
        },
      }),
      fill_opening_successful_applicant_application_stake_unstaking_period: new Option(u32, new BN(1) as BlockNumber),
      fill_opening_failed_applicant_application_stake_unstaking_period: new Option(u32, new BN(1) as BlockNumber),
      fill_opening_failed_applicant_role_stake_unstaking_period: new Option(u32, new BN(1) as BlockNumber),
      terminate_application_stake_unstaking_period: new Option(u32, new BN(1) as BlockNumber),
      terminate_role_stake_unstaking_period: new Option(u32, new BN(1) as BlockNumber),
      exit_role_application_stake_unstaking_period: new Option(u32, new BN(1) as BlockNumber),
      exit_role_stake_unstaking_period: new Option(u32, new BN(1) as BlockNumber),
    })

    // Proposal creation
    const proposalPromise: Promise<ProposalId> = this.apiWrapper.expectProposalCreated()
    await this.apiWrapper.proposeCreateWorkingGroupLeaderOpening(
      this.m1KeyPairs[0],
      proposalTitle,
      description,
      proposalStake,
      activateAtBlock,
      commitment,
      uuid().substring(0, 8),
      this.workingGroup
    )
    this.result = await proposalPromise
    if (expectFailure) {
      throw new Error('Successful fixture run while expecting failure')
    }
  }
}

export class BeginWorkingGroupLeaderApplicationReviewFixture implements Fixture {
  private apiWrapper: ApiWrapper
  private m1KeyPairs: KeyringPair[]
  private sudo: KeyringPair
  private openingId: OpeningId
  private workingGroup: string

  private result: ProposalId | undefined

  constructor(
    apiWrapper: ApiWrapper,
    m1KeyPairs: KeyringPair[],
    sudo: KeyringPair,
    openingId: OpeningId,
    workingGroup: string
  ) {
    this.apiWrapper = apiWrapper
    this.m1KeyPairs = m1KeyPairs
    this.sudo = sudo
    this.openingId = openingId
    this.workingGroup = workingGroup
  }

  public getResult(): ProposalId | undefined {
    return this.result
  }

  public async runner(expectFailure: boolean): Promise<void> {
    // Setup
    const proposalTitle: string = 'Testing proposal ' + uuid().substring(0, 8)
    const description: string = 'Testing begin working group lead application review proposal ' + uuid().substring(0, 8)

    // Proposal stake calculation
    const proposalStake: BN = new BN(25000)
    const proposalFee: BN = this.apiWrapper.estimateProposeBeginWorkingGroupLeaderApplicationReviewFee()
    await this.apiWrapper.transferBalance(this.sudo, this.m1KeyPairs[0].address, proposalFee.add(proposalStake))

    // Proposal creation
    const proposalPromise: Promise<ProposalId> = this.apiWrapper.expectProposalCreated()
    await this.apiWrapper.proposeBeginWorkingGroupLeaderApplicationReview(
      this.m1KeyPairs[0],
      proposalTitle,
      description,
      proposalStake,
      this.openingId,
      this.workingGroup
    )
    this.result = await proposalPromise
    if (expectFailure) {
      throw new Error('Successful fixture run while expecting failure')
    }
  }
}

export class FillLeaderOpeningProposalFixture implements Fixture {
  private apiWrapper: ApiWrapper
  private m1KeyPairs: KeyringPair[]
  private applicantRoleAccountAddress: string
  private sudo: KeyringPair
  private firstRewardInterval: BN
  private rewardInterval: BN
  private payoutAmount: BN
  private openingId: OpeningId
  private workingGroup: WorkingGroups

  private result: ProposalId | undefined

  constructor(
    apiWrapper: ApiWrapper,
    m1KeyPairs: KeyringPair[],
    applicantRoleAccountAddress: string,
    sudo: KeyringPair,
    firstRewardInterval: BN,
    rewardInterval: BN,
    payoutAmount: BN,
    openingId: OpeningId,
    workingGroup: WorkingGroups
  ) {
    this.apiWrapper = apiWrapper
    this.m1KeyPairs = m1KeyPairs
    this.applicantRoleAccountAddress = applicantRoleAccountAddress
    this.sudo = sudo
    this.firstRewardInterval = firstRewardInterval
    this.rewardInterval = rewardInterval
    this.payoutAmount = payoutAmount
    this.openingId = openingId
    this.workingGroup = workingGroup
  }

  public getResult(): ProposalId | undefined {
    return this.result
  }

  public async runner(expectFailure: boolean): Promise<void> {
    // Setup
    const proposalTitle: string = 'Testing proposal ' + uuid().substring(0, 8)
    const description: string = 'Testing fill opening proposal ' + uuid().substring(0, 8)
    const workingGroupString: string = this.apiWrapper.getWorkingGroupString(this.workingGroup)

    // Proposal stake calculation
    const proposalStake: BN = new BN(50000)
    const proposalFee: BN = this.apiWrapper.estimateProposeFillLeaderOpeningFee()
    await this.apiWrapper.transferBalance(this.sudo, this.m1KeyPairs[0].address, proposalFee.add(proposalStake))

    // Proposal creation
    const applicationId: BN = (
      await this.apiWrapper.getActiveApplicationsIdsByRoleAccount(this.applicantRoleAccountAddress, this.workingGroup)
    )[0]
    const now: BN = await this.apiWrapper.getBestBlock()

    const fillOpeningParameters: FillOpeningParameters = new FillOpeningParameters({
      opening_id: this.openingId as OpeningId,
      successful_application_id: applicationId as ApplicationId,
      reward_policy: new Option(
        RewardPolicy,
        new RewardPolicy({
          amount_per_payout: this.payoutAmount as Balance,
          next_payment_at_block: now.add(this.firstRewardInterval) as BlockNumber,
          payout_interval: new Option(u32, this.rewardInterval as u32),
        })
      ),
      working_group: new WorkingGroup(workingGroupString),
    })

    const proposalPromise: Promise<ProposalId> = this.apiWrapper.expectProposalCreated()
    await this.apiWrapper.proposeFillLeaderOpening(
      this.m1KeyPairs[0],
      proposalTitle,
      description,
      proposalStake,
      fillOpeningParameters
    )
    this.result = await proposalPromise
    if (expectFailure) {
      throw new Error('Successful fixture run while expecting failure')
    }
  }
}

export class TerminateLeaderRoleProposalFixture implements Fixture {
  private apiWrapper: ApiWrapper
  private m1KeyPairs: KeyringPair[]
  private leaderRoleAccountAddress: string
  private sudo: KeyringPair
  private slash: boolean
  private workingGroup: WorkingGroups

  private result: ProposalId | undefined

  constructor(
    apiWrapper: ApiWrapper,
    m1KeyPairs: KeyringPair[],
    leaderRoleAccountAddress: string,
    sudo: KeyringPair,
    slash: boolean,
    workingGroup: WorkingGroups
  ) {
    this.apiWrapper = apiWrapper
    this.m1KeyPairs = m1KeyPairs
    this.leaderRoleAccountAddress = leaderRoleAccountAddress
    this.sudo = sudo
    this.slash = slash
    this.workingGroup = workingGroup
  }

  public getResult(): ProposalId | undefined {
    return this.result
  }

  public async runner(expectFailure: boolean): Promise<void> {
    // Setup
    const proposalTitle: string = 'Testing proposal ' + uuid().substring(0, 8)
    const description: string = 'Testing begin working group lead application review proposal ' + uuid().substring(0, 8)
    const rationale: string = 'Testing leader termination ' + uuid().substring(0, 8)
    const workingGroupString: string = this.apiWrapper.getWorkingGroupString(this.workingGroup)
    const workerId: WorkerId = await this.apiWrapper.getWorkerIdByRoleAccount(
      this.leaderRoleAccountAddress,
      this.workingGroup
    )

    // Proposal stake calculation
    const proposalStake: BN = new BN(100000)
    const proposalFee: BN = this.apiWrapper.estimateProposeTerminateLeaderRoleFee()
    await this.apiWrapper.transferBalance(this.sudo, this.m1KeyPairs[0].address, proposalFee.add(proposalStake))

    // Proposal creation
    const proposalPromise: Promise<ProposalId> = this.apiWrapper.expectProposalCreated()
    await this.apiWrapper.proposeTerminateLeaderRole(
      this.m1KeyPairs[0],
      proposalTitle,
      description,
      proposalStake,
      workerId,
      rationale,
      this.slash,
      workingGroupString
    )
    this.result = await proposalPromise
    if (expectFailure) {
      throw new Error('Successful fixture run while expecting failure')
    }
  }
}

export class SetLeaderRewardProposalFixture implements Fixture {
  private apiWrapper: ApiWrapper
  private m1KeyPairs: KeyringPair[]
  private sudo: KeyringPair
  private payoutAmount: BN
  private workingGroup: WorkingGroups

  private result: ProposalId | undefined

  constructor(
    apiWrapper: ApiWrapper,
    m1KeyPairs: KeyringPair[],
    sudo: KeyringPair,
    payoutAmount: BN,
    workingGroup: WorkingGroups
  ) {
    this.apiWrapper = apiWrapper
    this.m1KeyPairs = m1KeyPairs
    this.sudo = sudo
    this.payoutAmount = payoutAmount
    this.workingGroup = workingGroup
  }

  public getResult(): ProposalId | undefined {
    return this.result
  }

  public async runner(expectFailure: boolean): Promise<void> {
    // Setup
    const proposalTitle: string = 'Testing proposal ' + uuid().substring(0, 8)
    const description: string = 'Testing set leader reward proposal ' + uuid().substring(0, 8)
    const workingGroupString: string = this.apiWrapper.getWorkingGroupString(this.workingGroup)
    const workerId: WorkerId = (await this.apiWrapper.getLeadWorkerId(this.workingGroup))!

    // Proposal stake calculation
    const proposalStake: BN = new BN(50000)
    const proposalFee: BN = this.apiWrapper.estimateProposeLeaderRewardFee()
    await this.apiWrapper.transferBalance(this.sudo, this.m1KeyPairs[0].address, proposalFee.add(proposalStake))

    // Proposal creation
    const proposalPromise: Promise<ProposalId> = this.apiWrapper.expectProposalCreated()
    await this.apiWrapper.proposeLeaderReward(
      this.m1KeyPairs[0],
      proposalTitle,
      description,
      proposalStake,
      workerId,
      this.payoutAmount,
      workingGroupString
    )
    this.result = await proposalPromise
    if (expectFailure) {
      throw new Error('Successful fixture run while expecting failure')
    }
  }
}

export class DecreaseLeaderStakeProposalFixture implements Fixture {
  private apiWrapper: ApiWrapper
  private m1KeyPairs: KeyringPair[]
  private sudo: KeyringPair
  private stakeDecrement: BN
  private workingGroup: WorkingGroups

  private result: ProposalId | undefined

  constructor(
    apiWrapper: ApiWrapper,
    m1KeyPairs: KeyringPair[],
    sudo: KeyringPair,
    stakeDecrement: BN,
    workingGroup: WorkingGroups
  ) {
    this.apiWrapper = apiWrapper
    this.m1KeyPairs = m1KeyPairs
    this.sudo = sudo
    this.stakeDecrement = stakeDecrement
    this.workingGroup = workingGroup
  }

  public getResult(): ProposalId | undefined {
    return this.result
  }

  public async runner(expectFailure: boolean): Promise<void> {
    // Setup
    const proposalTitle: string = 'Testing proposal ' + uuid().substring(0, 8)
    const description: string = 'Testing decrease leader stake proposal ' + uuid().substring(0, 8)
    const workingGroupString: string = this.apiWrapper.getWorkingGroupString(this.workingGroup)
    const workerId: WorkerId = (await this.apiWrapper.getLeadWorkerId(this.workingGroup))!

    // Proposal stake calculation
    const proposalStake: BN = new BN(50000)
    const proposalFee: BN = this.apiWrapper.estimateProposeDecreaseLeaderStakeFee()
    await this.apiWrapper.transferBalance(this.sudo, this.m1KeyPairs[0].address, proposalFee.add(proposalStake))

    // Proposal creation
    const proposalPromise: Promise<ProposalId> = this.apiWrapper.expectProposalCreated()
    await this.apiWrapper.proposeDecreaseLeaderStake(
      this.m1KeyPairs[0],
      proposalTitle,
      description,
      proposalStake,
      workerId,
      this.stakeDecrement,
      workingGroupString
    )
    this.result = await proposalPromise
    if (expectFailure) {
      throw new Error('Successful fixture run while expecting failure')
    }
  }
}

export class SlashLeaderProposalFixture implements Fixture {
  private apiWrapper: ApiWrapper
  private m1KeyPairs: KeyringPair[]
  private sudo: KeyringPair
  private slashAmount: BN
  private workingGroup: WorkingGroups

  private result: ProposalId | undefined

  constructor(
    apiWrapper: ApiWrapper,
    m1KeyPairs: KeyringPair[],
    sudo: KeyringPair,
    slashAmount: BN,
    workingGroup: WorkingGroups
  ) {
    this.apiWrapper = apiWrapper
    this.m1KeyPairs = m1KeyPairs
    this.sudo = sudo
    this.slashAmount = slashAmount
    this.workingGroup = workingGroup
  }

  public getResult(): ProposalId | undefined {
    return this.result
  }

  public async runner(expectFailure: boolean): Promise<void> {
    // Setup
    const proposalTitle: string = 'Testing proposal ' + uuid().substring(0, 8)
    const description: string = 'Testing slash leader stake proposal ' + uuid().substring(0, 8)
    const workingGroupString: string = this.apiWrapper.getWorkingGroupString(this.workingGroup)
    const workerId: WorkerId = (await this.apiWrapper.getLeadWorkerId(this.workingGroup))!

    // Proposal stake calculation
    const proposalStake: BN = new BN(50000)
    const proposalFee: BN = this.apiWrapper.estimateProposeSlashLeaderStakeFee()
    await this.apiWrapper.transferBalance(this.sudo, this.m1KeyPairs[0].address, proposalFee.add(proposalStake))

    // Proposal creation
    const proposalPromise: Promise<ProposalId> = this.apiWrapper.expectProposalCreated()
    await this.apiWrapper.proposeSlashLeaderStake(
      this.m1KeyPairs[0],
      proposalTitle,
      description,
      proposalStake,
      workerId,
      this.slashAmount,
      workingGroupString
    )
    this.result = await proposalPromise
    if (expectFailure) {
      throw new Error('Successful fixture run while expecting failure')
    }
  }
}

export class WorkingGroupMintCapacityProposalFixture implements Fixture {
  private apiWrapper: ApiWrapper
  private m1KeyPairs: KeyringPair[]
  private sudo: KeyringPair
  private mintCapacity: BN
  private workingGroup: WorkingGroups

  private result: ProposalId | undefined

  constructor(
    apiWrapper: ApiWrapper,
    m1KeyPairs: KeyringPair[],
    sudo: KeyringPair,
    mintCapacity: BN,
    workingGroup: WorkingGroups
  ) {
    this.apiWrapper = apiWrapper
    this.m1KeyPairs = m1KeyPairs
    this.sudo = sudo
    this.mintCapacity = mintCapacity
    this.workingGroup = workingGroup
  }

  public getResult(): ProposalId | undefined {
    return this.result
  }

  public async runner(expectFailure: boolean): Promise<void> {
    // Setup
    const proposalTitle: string = 'Testing proposal ' + uuid().substring(0, 8)
    const description: string = 'Testing working group mint capacity proposal ' + uuid().substring(0, 8)
    const workingGroupString: string = this.apiWrapper.getWorkingGroupString(this.workingGroup)

    // Proposal stake calculation
    const proposalStake: BN = new BN(50000)
    const proposalFee: BN = this.apiWrapper.estimateProposeWorkingGroupMintCapacityFee()
    await this.apiWrapper.transferBalance(this.sudo, this.m1KeyPairs[0].address, proposalFee.add(proposalStake))

    // Proposal creation
    const proposalPromise: Promise<ProposalId> = this.apiWrapper.expectProposalCreated()
    await this.apiWrapper.proposeWorkingGroupMintCapacity(
      this.m1KeyPairs[0],
      proposalTitle,
      description,
      proposalStake,
      this.mintCapacity,
      workingGroupString
    )
    this.result = await proposalPromise
    if (expectFailure) {
      throw new Error('Successful fixture run while expecting failure')
    }
  }
}

export class ElectionParametersProposalFixture implements Fixture {
  private apiWrapper: ApiWrapper
  private m1KeyPairs: KeyringPair[]
  private m2KeyPairs: KeyringPair[]
  private sudo: KeyringPair

  constructor(apiWrapper: ApiWrapper, m1KeyPairs: KeyringPair[], m2KeyPairs: KeyringPair[], sudo: KeyringPair) {
    this.apiWrapper = apiWrapper
    this.m1KeyPairs = m1KeyPairs
    this.m2KeyPairs = m2KeyPairs
    this.sudo = sudo
  }

  public async runner(expectFailure: boolean): Promise<void> {
    // Setup
    const proposalTitle: string = 'Testing proposal ' + uuid().substring(0, 8)
    const description: string = 'Testing validator count proposal ' + uuid().substring(0, 8)
    const runtimeVoteFee: BN = this.apiWrapper.estimateVoteForProposalFee()
    await this.apiWrapper.transferBalanceToAccounts(this.sudo, this.m2KeyPairs, runtimeVoteFee)
    const announcingPeriod: BN = await this.apiWrapper.getAnnouncingPeriod()
    const votingPeriod: BN = await this.apiWrapper.getVotingPeriod()
    const revealingPeriod: BN = await this.apiWrapper.getRevealingPeriod()
    const councilSize: BN = await this.apiWrapper.getCouncilSize()
    const candidacyLimit: BN = await this.apiWrapper.getCandidacyLimit()
    const newTermDuration: BN = await this.apiWrapper.getNewTermDuration()
    const minCouncilStake: BN = await this.apiWrapper.getMinCouncilStake()
    const minVotingStake: BN = await this.apiWrapper.getMinVotingStake()

    // Proposal stake calculation
    const proposalStake: BN = new BN(200000)
    const proposalFee: BN = this.apiWrapper.estimateProposeElectionParametersFee(
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
    )
    await this.apiWrapper.transferBalance(this.sudo, this.m1KeyPairs[0].address, proposalFee.add(proposalStake))

    // Proposal creation
    const proposedAnnouncingPeriod: BN = announcingPeriod.subn(1)
    const proposedVotingPeriod: BN = votingPeriod.addn(1)
    const proposedRevealingPeriod: BN = revealingPeriod.addn(1)
    const proposedCouncilSize: BN = councilSize.addn(1)
    const proposedCandidacyLimit: BN = candidacyLimit.addn(1)
    const proposedNewTermDuration: BN = newTermDuration.addn(1)
    const proposedMinCouncilStake: BN = minCouncilStake.addn(1)
    const proposedMinVotingStake: BN = minVotingStake.addn(1)
    const proposalPromise: Promise<ProposalId> = this.apiWrapper.expectProposalCreated()
    await this.apiWrapper.proposeElectionParameters(
      this.m1KeyPairs[0],
      proposalTitle,
      description,
      proposalStake,
      proposedAnnouncingPeriod,
      proposedVotingPeriod,
      proposedRevealingPeriod,
      proposedCouncilSize,
      proposedCandidacyLimit,
      proposedNewTermDuration,
      proposedMinCouncilStake,
      proposedMinVotingStake
    )
    const proposalNumber: ProposalId = await proposalPromise

    // Approving the proposal
    const proposalExecutionPromise: Promise<void> = this.apiWrapper.expectProposalFinalized()
    await this.apiWrapper.batchApproveProposal(this.m2KeyPairs, proposalNumber)
    await proposalExecutionPromise

    // Assertions
    const newAnnouncingPeriod: BN = await this.apiWrapper.getAnnouncingPeriod()
    const newVotingPeriod: BN = await this.apiWrapper.getVotingPeriod()
    const newRevealingPeriod: BN = await this.apiWrapper.getRevealingPeriod()
    const newCouncilSize: BN = await this.apiWrapper.getCouncilSize()
    const newCandidacyLimit: BN = await this.apiWrapper.getCandidacyLimit()
    const newNewTermDuration: BN = await this.apiWrapper.getNewTermDuration()
    const newMinCouncilStake: BN = await this.apiWrapper.getMinCouncilStake()
    const newMinVotingStake: BN = await this.apiWrapper.getMinVotingStake()
    assert(
      proposedAnnouncingPeriod.eq(newAnnouncingPeriod),
      `Announcing period has unexpected value ${newAnnouncingPeriod}, expected ${proposedAnnouncingPeriod}`
    )
    assert(
      proposedVotingPeriod.eq(newVotingPeriod),
      `Voting period has unexpected value ${newVotingPeriod}, expected ${proposedVotingPeriod}`
    )
    assert(
      proposedRevealingPeriod.eq(newRevealingPeriod),
      `Revealing has unexpected value ${newRevealingPeriod}, expected ${proposedRevealingPeriod}`
    )
    assert(
      proposedCouncilSize.eq(newCouncilSize),
      `Council size has unexpected value ${newCouncilSize}, expected ${proposedCouncilSize}`
    )
    assert(
      proposedCandidacyLimit.eq(newCandidacyLimit),
      `Candidacy limit has unexpected value ${newCandidacyLimit}, expected ${proposedCandidacyLimit}`
    )
    assert(
      proposedNewTermDuration.eq(newNewTermDuration),
      `New term duration has unexpected value ${newNewTermDuration}, expected ${proposedNewTermDuration}`
    )
    assert(
      proposedMinCouncilStake.eq(newMinCouncilStake),
      `Min council stake has unexpected value ${newMinCouncilStake}, expected ${proposedMinCouncilStake}`
    )
    assert(
      proposedMinVotingStake.eq(newMinVotingStake),
      `Min voting stake has unexpected value ${newMinVotingStake}, expected ${proposedMinVotingStake}`
    )
    if (expectFailure) {
      throw new Error('Successful fixture run while expecting failure')
    }
  }
}

export class SetLeadProposalFixture implements Fixture {
  private apiWrapper: ApiWrapper
  private m1KeyPairs: KeyringPair[]
  private m2KeyPairs: KeyringPair[]
  private sudo: KeyringPair

  constructor(apiWrapper: ApiWrapper, m1KeyPairs: KeyringPair[], m2KeyPairs: KeyringPair[], sudo: KeyringPair) {
    this.apiWrapper = apiWrapper
    this.m1KeyPairs = m1KeyPairs
    this.m2KeyPairs = m2KeyPairs
    this.sudo = sudo
  }

  public async runner(expectFailure: boolean): Promise<void> {
    // Setup
    const proposalTitle: string = 'Testing proposal ' + uuid().substring(0, 8)
    const description: string = 'Testing validator count proposal ' + uuid().substring(0, 8)
    const runtimeVoteFee: BN = this.apiWrapper.estimateVoteForProposalFee()
    await this.apiWrapper.transferBalanceToAccounts(this.sudo, this.m2KeyPairs, runtimeVoteFee)

    // Proposal stake calculation
    const proposalStake: BN = new BN(50000)
    const proposalFee: BN = this.apiWrapper.estimateProposeLeadFee(
      description,
      description,
      proposalStake,
      this.sudo.address
    )
    await this.apiWrapper.transferBalance(this.sudo, this.m1KeyPairs[0].address, proposalFee.add(proposalStake))

    // Proposal creation
    const proposalPromise: Promise<ProposalId> = this.apiWrapper.expectProposalCreated()
    await this.apiWrapper.proposeLead(this.m1KeyPairs[0], proposalTitle, description, proposalStake, this.m1KeyPairs[1])
    const proposalNumber: ProposalId = await proposalPromise

    // Approving the proposal
    const proposalExecutionPromise: Promise<void> = this.apiWrapper.expectProposalFinalized()
    await this.apiWrapper.batchApproveProposal(this.m2KeyPairs, proposalNumber)
    await proposalExecutionPromise
    const newLead: string = await this.apiWrapper.getCurrentLeadAddress()
    assert(
      newLead === this.m1KeyPairs[1].address,
      `New lead has unexpected value ${newLead}, expected ${this.m1KeyPairs[1].address}`
    )
    if (expectFailure) {
      throw new Error('Successful fixture run while expecting failure')
    }
  }
}

export class SpendingProposalFixture implements Fixture {
  private apiWrapper: ApiWrapper
  private m1KeyPairs: KeyringPair[]
  private m2KeyPairs: KeyringPair[]
  private sudo: KeyringPair
  private spendingBalance: BN
  private mintCapacity: BN

  constructor(
    apiWrapper: ApiWrapper,
    m1KeyPairs: KeyringPair[],
    m2KeyPairs: KeyringPair[],
    sudo: KeyringPair,
    spendingBalance: BN,
    mintCapacity: BN
  ) {
    this.apiWrapper = apiWrapper
    this.m1KeyPairs = m1KeyPairs
    this.m2KeyPairs = m2KeyPairs
    this.sudo = sudo
    this.spendingBalance = spendingBalance
    this.mintCapacity = mintCapacity
  }

  public async runner(expectFailure: boolean): Promise<void> {
    // Setup
    const description = 'spending proposal which is used for API network testing with some mock data'
    const runtimeVoteFee: BN = this.apiWrapper.estimateVoteForProposalFee()

    // Topping the balances
    const proposalStake: BN = new BN(25000)
    const runtimeProposalFee: BN = this.apiWrapper.estimateProposeSpendingFee(
      description,
      description,
      proposalStake,
      this.spendingBalance,
      this.sudo.address
    )
    await this.apiWrapper.transferBalance(this.sudo, this.m1KeyPairs[0].address, runtimeProposalFee.add(proposalStake))
    await this.apiWrapper.transferBalanceToAccounts(this.sudo, this.m2KeyPairs, runtimeVoteFee)
    await this.apiWrapper.sudoSetCouncilMintCapacity(this.sudo, this.mintCapacity)

    // Proposal creation
    const proposalPromise: Promise<ProposalId> = this.apiWrapper.expectProposalCreated()
    await this.apiWrapper.proposeSpending(
      this.m1KeyPairs[0],
      'testing spending' + uuid().substring(0, 8),
      'spending to test proposal functionality' + uuid().substring(0, 8),
      proposalStake,
      this.spendingBalance,
      this.sudo.address
    )
    const proposalNumber: ProposalId = await proposalPromise

    // Approving spending proposal
    const balanceBeforeMinting: BN = await this.apiWrapper.getBalance(this.sudo.address)
    const spendingPromise: Promise<void> = this.apiWrapper.expectProposalFinalized()
    await this.apiWrapper.batchApproveProposal(this.m2KeyPairs, proposalNumber)
    await spendingPromise
    const balanceAfterMinting: BN = await this.apiWrapper.getBalance(this.sudo.address)
    assert(
      balanceAfterMinting.sub(balanceBeforeMinting).eq(this.spendingBalance),
      `member ${
        this.m1KeyPairs[0].address
      } has unexpected balance ${balanceAfterMinting}, expected ${balanceBeforeMinting.add(this.spendingBalance)}`
    )
    if (expectFailure) {
      throw new Error('Successful fixture run while expecting failure')
    }
  }
}

export class TextProposalFixture implements Fixture {
  private apiWrapper: ApiWrapper
  private m1KeyPairs: KeyringPair[]
  private m2KeyPairs: KeyringPair[]
  private sudo: KeyringPair

  constructor(apiWrapper: ApiWrapper, m1KeyPairs: KeyringPair[], m2KeyPairs: KeyringPair[], sudo: KeyringPair) {
    this.apiWrapper = apiWrapper
    this.m1KeyPairs = m1KeyPairs
    this.m2KeyPairs = m2KeyPairs
    this.sudo = sudo
  }

  public async runner(expectFailure: boolean): Promise<void> {
    // Setup
    const proposalTitle: string = 'Testing proposal ' + uuid().substring(0, 8)
    const description: string = 'Testing text proposal ' + uuid().substring(0, 8)
    const proposalText: string = 'Text of the testing proposal ' + uuid().substring(0, 8)
    const runtimeVoteFee: BN = this.apiWrapper.estimateVoteForProposalFee()
    await this.apiWrapper.transferBalanceToAccounts(this.sudo, this.m2KeyPairs, runtimeVoteFee)

    // Proposal stake calculation
    const proposalStake: BN = new BN(25000)
    const runtimeProposalFee: BN = this.apiWrapper.estimateProposeTextFee(
      proposalStake,
      description,
      description,
      proposalText
    )
    await this.apiWrapper.transferBalance(this.sudo, this.m1KeyPairs[0].address, runtimeProposalFee.add(proposalStake))

    // Proposal creation
    const proposalPromise: Promise<ProposalId> = this.apiWrapper.expectProposalCreated()
    await this.apiWrapper.proposeText(this.m1KeyPairs[0], proposalStake, proposalTitle, description, proposalText)
    const proposalNumber: ProposalId = await proposalPromise

    // Approving text proposal
    const textProposalPromise: Promise<void> = this.apiWrapper.expectProposalFinalized()
    await this.apiWrapper.batchApproveProposal(this.m2KeyPairs, proposalNumber)
    await textProposalPromise
    if (expectFailure) {
      throw new Error('Successful fixture run while expecting failure')
    }
  }
}

export class ValidatorCountProposalFixture implements Fixture {
  private apiWrapper: ApiWrapper
  private m1KeyPairs: KeyringPair[]
  private m2KeyPairs: KeyringPair[]
  private sudo: KeyringPair
  private validatorCountIncrement: BN

  constructor(
    apiWrapper: ApiWrapper,
    m1KeyPairs: KeyringPair[],
    m2KeyPairs: KeyringPair[],
    sudo: KeyringPair,
    validatorCountIncrement: BN
  ) {
    this.apiWrapper = apiWrapper
    this.m1KeyPairs = m1KeyPairs
    this.m2KeyPairs = m2KeyPairs
    this.sudo = sudo
    this.validatorCountIncrement = validatorCountIncrement
  }

  public async runner(expectFailure: boolean): Promise<void> {
    // Setup
    const proposalTitle: string = 'Testing proposal ' + uuid().substring(0, 8)
    const description: string = 'Testing validator count proposal ' + uuid().substring(0, 8)
    const runtimeVoteFee: BN = this.apiWrapper.estimateVoteForProposalFee()
    await this.apiWrapper.transferBalanceToAccounts(this.sudo, this.m2KeyPairs, runtimeVoteFee)

    // Proposal stake calculation
    const proposalStake: BN = new BN(100000)
    const proposalFee: BN = this.apiWrapper.estimateProposeValidatorCountFee(description, description, proposalStake)
    await this.apiWrapper.transferBalance(this.sudo, this.m1KeyPairs[0].address, proposalFee.add(proposalStake))
    const validatorCount: BN = await this.apiWrapper.getValidatorCount()

    // Proposal creation
    const proposedValidatorCount: BN = validatorCount.add(this.validatorCountIncrement)
    const proposalPromise: Promise<ProposalId> = this.apiWrapper.expectProposalCreated()
    await this.apiWrapper.proposeValidatorCount(
      this.m1KeyPairs[0],
      proposalTitle,
      description,
      proposalStake,
      proposedValidatorCount
    )
    const proposalNumber: ProposalId = await proposalPromise

    // Approving the proposal
    const proposalExecutionPromise: Promise<void> = this.apiWrapper.expectProposalFinalized()
    await this.apiWrapper.batchApproveProposal(this.m2KeyPairs, proposalNumber)
    await proposalExecutionPromise
    const newValidatorCount: BN = await this.apiWrapper.getValidatorCount()
    assert(
      proposedValidatorCount.eq(newValidatorCount),
      `Validator count has unexpeccted value ${newValidatorCount}, expected ${proposedValidatorCount}`
    )
    if (expectFailure) {
      throw new Error('Successful fixture run while expecting failure')
    }
  }
}

export class ContentWorkingGroupMintCapacityProposalFixture implements Fixture {
  private apiWrapper: ApiWrapper
  private m1KeyPairs: KeyringPair[]
  private m2KeyPairs: KeyringPair[]
  private sudo: KeyringPair
  private mintingCapacityIncrement: BN

  constructor(
    apiWrapper: ApiWrapper,
    m1KeyPairs: KeyringPair[],
    m2KeyPairs: KeyringPair[],
    sudo: KeyringPair,
    mintingCapacityIncrement: BN
  ) {
    this.apiWrapper = apiWrapper
    this.m1KeyPairs = m1KeyPairs
    this.m2KeyPairs = m2KeyPairs
    this.sudo = sudo
    this.mintingCapacityIncrement = mintingCapacityIncrement
  }

  public async runner(expectFailure: boolean): Promise<void> {
    // Setup
    const description = 'Mint capacity proposal which is used for API network testing'
    const runtimeVoteFee: BN = this.apiWrapper.estimateVoteForProposalFee()
    const initialMintingCapacity: BN = await this.apiWrapper.getContentWorkingGroupMintCapacity()

    // Topping the balances
    const proposalStake: BN = new BN(50000)
    const runtimeProposalFee: BN = this.apiWrapper.estimateProposeContentWorkingGroupMintCapacityFee(
      description,
      description,
      proposalStake,
      initialMintingCapacity.add(this.mintingCapacityIncrement)
    )
    await this.apiWrapper.transferBalance(this.sudo, this.m1KeyPairs[0].address, runtimeProposalFee.add(proposalStake))
    await this.apiWrapper.transferBalanceToAccounts(this.sudo, this.m2KeyPairs, runtimeVoteFee)

    // Proposal creation
    const proposedMintingCapacity: BN = initialMintingCapacity.add(this.mintingCapacityIncrement)
    const proposalPromise: Promise<ProposalId> = this.apiWrapper.expectProposalCreated()
    await this.apiWrapper.proposeContentWorkingGroupMintCapacity(
      this.m1KeyPairs[0],
      'testing mint capacity' + uuid().substring(0, 8),
      'mint capacity to test proposal functionality' + uuid().substring(0, 8),
      proposalStake,
      proposedMintingCapacity
    )
    const proposalNumber: ProposalId = await proposalPromise

    // Approving mint capacity proposal
    const mintCapacityPromise: Promise<void> = this.apiWrapper.expectProposalFinalized()
    await this.apiWrapper.batchApproveProposal(this.m2KeyPairs, proposalNumber)
    await mintCapacityPromise
    const newMintingCapacity: BN = await this.apiWrapper.getContentWorkingGroupMintCapacity()
    assert(
      proposedMintingCapacity.eq(newMintingCapacity),
      `Content working group has unexpected minting capacity ${newMintingCapacity}, expected ${proposedMintingCapacity}`
    )
    if (expectFailure) {
      throw new Error('Successful fixture run while expecting failure')
    }
  }
}

export class UpdateRuntimeFixture implements Fixture {
  private apiWrapper: ApiWrapper
  private m1KeyPairs: KeyringPair[]
  private m2KeyPairs: KeyringPair[]
  private sudo: KeyringPair

  constructor(apiWrapper: ApiWrapper, m1KeyPairs: KeyringPair[], m2KeyPairs: KeyringPair[], sudo: KeyringPair) {
    this.apiWrapper = apiWrapper
    this.m1KeyPairs = m1KeyPairs
    this.m2KeyPairs = m2KeyPairs
    this.sudo = sudo
  }

  public async runner(expectFailure: boolean): Promise<void> {
    // Setup
    const runtime: Bytes = await this.apiWrapper.getRuntime()
    const description = 'runtime upgrade proposal which is used for API network testing'
    const runtimeVoteFee: BN = this.apiWrapper.estimateVoteForProposalFee()

    // Topping the balances
    const proposalStake: BN = new BN(1000000)
    const runtimeProposalFee: BN = this.apiWrapper.estimateProposeRuntimeUpgradeFee(
      proposalStake,
      description,
      description,
      runtime
    )
    await this.apiWrapper.transferBalance(this.sudo, this.m1KeyPairs[0].address, runtimeProposalFee.add(proposalStake))
    await this.apiWrapper.transferBalanceToAccounts(this.sudo, this.m2KeyPairs, runtimeVoteFee)

    // Proposal creation
    const proposalPromise: Promise<ProposalId> = this.apiWrapper.expectProposalCreated()
    await this.apiWrapper.proposeRuntime(
      this.m1KeyPairs[0],
      proposalStake,
      'testing runtime' + uuid().substring(0, 8),
      'runtime to test proposal functionality' + uuid().substring(0, 8),
      runtime
    )
    const proposalNumber: ProposalId = await proposalPromise

    // Approving runtime update proposal
    const runtimePromise: Promise<void> = this.apiWrapper.expectProposalFinalized()
    await this.apiWrapper.batchApproveProposal(this.m2KeyPairs, proposalNumber)
    await runtimePromise
    if (expectFailure) {
      throw new Error('Successful fixture run while expecting failure')
    }
  }
}

export class VoteForProposalFixture implements Fixture {
  private apiWrapper: ApiWrapper
  private m2KeyPairs: KeyringPair[]
  private sudo: KeyringPair
  private proposalNumber: ProposalId

  constructor(apiWrapper: ApiWrapper, m2KeyPairs: KeyringPair[], sudo: KeyringPair, proposalNumber: ProposalId) {
    this.apiWrapper = apiWrapper
    this.m2KeyPairs = m2KeyPairs
    this.sudo = sudo
    this.proposalNumber = proposalNumber
  }

  public async runner(expectFailure: boolean): Promise<void> {
    const proposalVoteFee: BN = this.apiWrapper.estimateVoteForProposalFee()
    await this.apiWrapper.transferBalanceToAccounts(this.sudo, this.m2KeyPairs, proposalVoteFee)

    // Approving the proposal
    const proposalExecutionPromise: Promise<void> = this.apiWrapper.expectProposalFinalized()
    await this.apiWrapper.batchApproveProposal(this.m2KeyPairs, this.proposalNumber)
    await proposalExecutionPromise
    if (expectFailure) {
      throw new Error('Successful fixture run while expecting failure')
    }
  }
}
