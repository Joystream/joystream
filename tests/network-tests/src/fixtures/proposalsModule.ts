import { KeyringPair } from '@polkadot/keyring/types'
import { Api, WorkingGroups } from '../Api'
import { v4 as uuid } from 'uuid'
import BN from 'bn.js'
import { ProposalId } from '@joystream/types/proposals'
import { Fixture } from '../IFixture'
import { assert } from 'chai'
import { ApplicationId, OpeningId } from '@joystream/types/hiring'
import { WorkerId } from '@joystream/types/working-group'
import { Utils } from '../utils'

export class CreateWorkingGroupLeaderOpeningFixture implements Fixture {
  private api: Api
  private membersKeyPairs: KeyringPair[]
  private treasury: KeyringPair
  private applicationStake: BN
  private roleStake: BN
  private workingGroup: string

  private result: ProposalId | undefined

  constructor(
    api: Api,
    membersKeyPairs: KeyringPair[],
    treasury: KeyringPair,
    applicationStake: BN,
    roleStake: BN,
    workingGroup: string
  ) {
    this.api = api
    this.membersKeyPairs = membersKeyPairs
    this.treasury = treasury
    this.applicationStake = applicationStake
    this.roleStake = roleStake
    this.workingGroup = workingGroup
  }

  public getCreatedProposalId(): ProposalId | undefined {
    return this.result
  }

  public async runner(expectFailure: boolean): Promise<void> {
    // Setup
    const proposalTitle: string = 'Testing proposal ' + uuid().substring(0, 8)
    const description: string = 'Testing working group lead opening proposal ' + uuid().substring(0, 8)

    // Proposal stake calculation
    const proposalStake: BN = new BN(100000)
    const proposalFee: BN = this.api.estimateProposeCreateWorkingGroupLeaderOpeningFee()
    await this.api.transferBalance(this.treasury, this.membersKeyPairs[0].address, proposalFee.add(proposalStake))

    // Proposal creation
    const proposalPromise: Promise<ProposalId> = this.api.expectProposalCreated()
    await this.api.proposeCreateWorkingGroupLeaderOpening({
      account: this.membersKeyPairs[0],
      title: proposalTitle,
      description: description,
      proposalStake: proposalStake,
      actiavteAt: 'CurrentBlock',
      maxActiveApplicants: new BN(this.membersKeyPairs.length),
      maxReviewPeriodLength: new BN(32),
      applicationStakingPolicyAmount: this.applicationStake,
      applicationCrowdedOutUnstakingPeriodLength: new BN(1),
      applicationReviewPeriodExpiredUnstakingPeriodLength: new BN(1),
      roleStakingPolicyAmount: this.roleStake,
      roleCrowdedOutUnstakingPeriodLength: new BN(1),
      roleReviewPeriodExpiredUnstakingPeriodLength: new BN(1),
      slashableMaxCount: new BN(1),
      slashableMaxPercentPtsPerTime: new BN(100),
      fillOpeningSuccessfulApplicantApplicationStakeUnstakingPeriod: new BN(1),
      fillOpeningFailedApplicantApplicationStakeUnstakingPeriod: new BN(1),
      fillOpeningFailedApplicantRoleStakeUnstakingPeriod: new BN(1),
      terminateApplicationStakeUnstakingPeriod: new BN(1),
      terminateRoleStakeUnstakingPeriod: new BN(1),
      exitRoleApplicationStakeUnstakingPeriod: new BN(1),
      exitRoleStakeUnstakingPeriod: new BN(1),
      text: uuid().substring(0, 8),
      workingGroup: this.workingGroup,
    })
    this.result = await proposalPromise
    if (expectFailure) {
      throw new Error('Successful fixture run while expecting failure')
    }
  }
}

export class BeginWorkingGroupLeaderApplicationReviewFixture implements Fixture {
  private api: Api
  private membersKeyPairs: KeyringPair[]
  private treasury: KeyringPair
  private openingId: OpeningId
  private workingGroup: string

  private result: ProposalId | undefined

  constructor(
    api: Api,
    membersKeyPairs: KeyringPair[],
    treasury: KeyringPair,
    openingId: OpeningId,
    workingGroup: string
  ) {
    this.api = api
    this.membersKeyPairs = membersKeyPairs
    this.treasury = treasury
    this.openingId = openingId
    this.workingGroup = workingGroup
  }

  public getCreatedProposalId(): ProposalId | undefined {
    return this.result
  }

  public async runner(expectFailure: boolean): Promise<void> {
    // Setup
    const proposalTitle: string = 'Testing proposal ' + uuid().substring(0, 8)
    const description: string = 'Testing begin working group lead application review proposal ' + uuid().substring(0, 8)

    // Proposal stake calculation
    const proposalStake: BN = new BN(25000)
    const proposalFee: BN = this.api.estimateProposeBeginWorkingGroupLeaderApplicationReviewFee()
    await this.api.transferBalance(this.treasury, this.membersKeyPairs[0].address, proposalFee.add(proposalStake))

    // Proposal creation
    const proposalPromise: Promise<ProposalId> = this.api.expectProposalCreated()
    await this.api.proposeBeginWorkingGroupLeaderApplicationReview(
      this.membersKeyPairs[0],
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
  private api: Api
  private membersKeyPairs: KeyringPair[]
  private applicantRoleAccountAddress: string
  private treasury: KeyringPair
  private firstRewardInterval: BN
  private rewardInterval: BN
  private payoutAmount: BN
  private openingId: OpeningId
  private workingGroup: WorkingGroups

  private result: ProposalId | undefined

  constructor(
    api: Api,
    membersKeyPairs: KeyringPair[],
    applicantRoleAccountAddress: string,
    treasury: KeyringPair,
    firstRewardInterval: BN,
    rewardInterval: BN,
    payoutAmount: BN,
    openingId: OpeningId,
    workingGroup: WorkingGroups
  ) {
    this.api = api
    this.membersKeyPairs = membersKeyPairs
    this.applicantRoleAccountAddress = applicantRoleAccountAddress
    this.treasury = treasury
    this.firstRewardInterval = firstRewardInterval
    this.rewardInterval = rewardInterval
    this.payoutAmount = payoutAmount
    this.openingId = openingId
    this.workingGroup = workingGroup
  }

  public getCreatedProposalId(): ProposalId | undefined {
    return this.result
  }

  public async runner(expectFailure: boolean): Promise<void> {
    // Setup
    const proposalTitle: string = 'Testing proposal ' + uuid().substring(0, 8)
    const description: string = 'Testing fill opening proposal ' + uuid().substring(0, 8)
    const workingGroupString: string = this.api.getWorkingGroupString(this.workingGroup)

    // Proposal stake calculation
    const proposalStake: BN = new BN(50000)
    const proposalFee: BN = this.api.estimateProposeFillLeaderOpeningFee()
    await this.api.transferBalance(this.treasury, this.membersKeyPairs[0].address, proposalFee.add(proposalStake))

    // Proposal creation
    const applicationId: ApplicationId = (
      await this.api.getActiveApplicationsIdsByRoleAccount(this.applicantRoleAccountAddress, this.workingGroup)
    )[0]
    const now: BN = await this.api.getBestBlock()

    const proposalPromise: Promise<ProposalId> = this.api.expectProposalCreated()
    await this.api.proposeFillLeaderOpening({
      account: this.membersKeyPairs[0],
      title: proposalTitle,
      description: description,
      proposalStake: proposalStake,
      openingId: this.openingId,
      successfulApplicationId: applicationId,
      amountPerPayout: this.payoutAmount,
      nextPaymentAtBlock: now.add(this.firstRewardInterval),
      payoutInterval: this.rewardInterval,
      workingGroup: workingGroupString,
    })
    this.result = await proposalPromise
    if (expectFailure) {
      throw new Error('Successful fixture run while expecting failure')
    }
  }
}

export class TerminateLeaderRoleProposalFixture implements Fixture {
  private api: Api
  private membersKeyPairs: KeyringPair[]
  private leaderRoleAccountAddress: string
  private treasury: KeyringPair
  private slash: boolean
  private workingGroup: WorkingGroups

  private result: ProposalId | undefined

  constructor(
    api: Api,
    membersKeyPairs: KeyringPair[],
    leaderRoleAccountAddress: string,
    treasury: KeyringPair,
    slash: boolean,
    workingGroup: WorkingGroups
  ) {
    this.api = api
    this.membersKeyPairs = membersKeyPairs
    this.leaderRoleAccountAddress = leaderRoleAccountAddress
    this.treasury = treasury
    this.slash = slash
    this.workingGroup = workingGroup
  }

  public getCreatedProposalId(): ProposalId | undefined {
    return this.result
  }

  public async runner(expectFailure: boolean): Promise<void> {
    // Setup
    const proposalTitle: string = 'Testing proposal ' + uuid().substring(0, 8)
    const description: string = 'Testing begin working group lead application review proposal ' + uuid().substring(0, 8)
    const rationale: string = 'Testing leader termination ' + uuid().substring(0, 8)
    const workingGroupString: string = this.api.getWorkingGroupString(this.workingGroup)
    const workerId: WorkerId = await this.api.getWorkerIdByRoleAccount(this.leaderRoleAccountAddress, this.workingGroup)

    // Proposal stake calculation
    const proposalStake: BN = new BN(100000)
    const proposalFee: BN = this.api.estimateProposeTerminateLeaderRoleFee()
    await this.api.transferBalance(this.treasury, this.membersKeyPairs[0].address, proposalFee.add(proposalStake))

    // Proposal creation
    const proposalPromise: Promise<ProposalId> = this.api.expectProposalCreated()
    await this.api.proposeTerminateLeaderRole(
      this.membersKeyPairs[0],
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
  private api: Api
  private membersKeyPairs: KeyringPair[]
  private treasury: KeyringPair
  private payoutAmount: BN
  private workingGroup: WorkingGroups

  private result: ProposalId | undefined

  constructor(
    api: Api,
    membersKeyPairs: KeyringPair[],
    treasury: KeyringPair,
    payoutAmount: BN,
    workingGroup: WorkingGroups
  ) {
    this.api = api
    this.membersKeyPairs = membersKeyPairs
    this.treasury = treasury
    this.payoutAmount = payoutAmount
    this.workingGroup = workingGroup
  }

  public getCreatedProposalId(): ProposalId | undefined {
    return this.result
  }

  public async runner(expectFailure: boolean): Promise<void> {
    // Setup
    const proposalTitle: string = 'Testing proposal ' + uuid().substring(0, 8)
    const description: string = 'Testing set leader reward proposal ' + uuid().substring(0, 8)
    const workingGroupString: string = this.api.getWorkingGroupString(this.workingGroup)
    const workerId: WorkerId = (await this.api.getLeadWorkerId(this.workingGroup))!

    // Proposal stake calculation
    const proposalStake: BN = new BN(50000)
    const proposalFee: BN = this.api.estimateProposeLeaderRewardFee()
    await this.api.transferBalance(this.treasury, this.membersKeyPairs[0].address, proposalFee.add(proposalStake))

    // Proposal creation
    const proposalPromise: Promise<ProposalId> = this.api.expectProposalCreated()
    await this.api.proposeLeaderReward(
      this.membersKeyPairs[0],
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
  private api: Api
  private membersKeyPairs: KeyringPair[]
  private treasury: KeyringPair
  private stakeDecrement: BN
  private workingGroup: WorkingGroups

  private result: ProposalId | undefined

  constructor(
    api: Api,
    membersKeyPairs: KeyringPair[],
    treasury: KeyringPair,
    stakeDecrement: BN,
    workingGroup: WorkingGroups
  ) {
    this.api = api
    this.membersKeyPairs = membersKeyPairs
    this.treasury = treasury
    this.stakeDecrement = stakeDecrement
    this.workingGroup = workingGroup
  }

  public getCreatedProposalId(): ProposalId | undefined {
    return this.result
  }

  public async runner(expectFailure: boolean): Promise<void> {
    // Setup
    const proposalTitle: string = 'Testing proposal ' + uuid().substring(0, 8)
    const description: string = 'Testing decrease leader stake proposal ' + uuid().substring(0, 8)
    const workingGroupString: string = this.api.getWorkingGroupString(this.workingGroup)
    const workerId: WorkerId = (await this.api.getLeadWorkerId(this.workingGroup))!

    // Proposal stake calculation
    const proposalStake: BN = new BN(50000)
    const proposalFee: BN = this.api.estimateProposeDecreaseLeaderStakeFee()
    await this.api.transferBalance(this.treasury, this.membersKeyPairs[0].address, proposalFee.add(proposalStake))

    // Proposal creation
    const proposalPromise: Promise<ProposalId> = this.api.expectProposalCreated()
    await this.api.proposeDecreaseLeaderStake(
      this.membersKeyPairs[0],
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
  private api: Api
  private membersKeyPairs: KeyringPair[]
  private treasury: KeyringPair
  private slashAmount: BN
  private workingGroup: WorkingGroups

  private result: ProposalId | undefined

  constructor(
    api: Api,
    membersKeyPairs: KeyringPair[],
    treasury: KeyringPair,
    slashAmount: BN,
    workingGroup: WorkingGroups
  ) {
    this.api = api
    this.membersKeyPairs = membersKeyPairs
    this.treasury = treasury
    this.slashAmount = slashAmount
    this.workingGroup = workingGroup
  }

  public getCreatedProposalId(): ProposalId | undefined {
    return this.result
  }

  public async runner(expectFailure: boolean): Promise<void> {
    // Setup
    const proposalTitle: string = 'Testing proposal ' + uuid().substring(0, 8)
    const description: string = 'Testing slash leader stake proposal ' + uuid().substring(0, 8)
    const workingGroupString: string = this.api.getWorkingGroupString(this.workingGroup)
    const workerId: WorkerId = (await this.api.getLeadWorkerId(this.workingGroup))!

    // Proposal stake calculation
    const proposalStake: BN = new BN(50000)
    const proposalFee: BN = this.api.estimateProposeSlashLeaderStakeFee()
    await this.api.transferBalance(this.treasury, this.membersKeyPairs[0].address, proposalFee.add(proposalStake))

    // Proposal creation
    const proposalPromise: Promise<ProposalId> = this.api.expectProposalCreated()
    await this.api.proposeSlashLeaderStake(
      this.membersKeyPairs[0],
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
  private api: Api
  private membersKeyPairs: KeyringPair[]
  private treasury: KeyringPair
  private mintCapacity: BN
  private workingGroup: WorkingGroups

  private result: ProposalId | undefined

  constructor(
    api: Api,
    membersKeyPairs: KeyringPair[],
    treasury: KeyringPair,
    mintCapacity: BN,
    workingGroup: WorkingGroups
  ) {
    this.api = api
    this.membersKeyPairs = membersKeyPairs
    this.treasury = treasury
    this.mintCapacity = mintCapacity
    this.workingGroup = workingGroup
  }

  public getCreatedProposalId(): ProposalId | undefined {
    return this.result
  }

  public async runner(expectFailure: boolean): Promise<void> {
    // Setup
    const proposalTitle: string = 'Testing proposal ' + uuid().substring(0, 8)
    const description: string = 'Testing working group mint capacity proposal ' + uuid().substring(0, 8)
    const workingGroupString: string = this.api.getWorkingGroupString(this.workingGroup)

    // Proposal stake calculation
    const proposalStake: BN = new BN(50000)
    const proposalFee: BN = this.api.estimateProposeWorkingGroupMintCapacityFee()
    await this.api.transferBalance(this.treasury, this.membersKeyPairs[0].address, proposalFee.add(proposalStake))

    // Proposal creation
    const proposalPromise: Promise<ProposalId> = this.api.expectProposalCreated()
    await this.api.proposeWorkingGroupMintCapacity(
      this.membersKeyPairs[0],
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
  private api: Api
  private membersKeyPairs: KeyringPair[]
  private councilKeyPairs: KeyringPair[]
  private treasury: KeyringPair

  constructor(api: Api, membersKeyPairs: KeyringPair[], councilKeyPairs: KeyringPair[], treasury: KeyringPair) {
    this.api = api
    this.membersKeyPairs = membersKeyPairs
    this.councilKeyPairs = councilKeyPairs
    this.treasury = treasury
  }

  public async runner(expectFailure: boolean): Promise<void> {
    // Setup
    const proposalTitle: string = 'Testing proposal ' + uuid().substring(0, 8)
    const description: string = 'Testing validator count proposal ' + uuid().substring(0, 8)
    const runtimeVoteFee: BN = this.api.estimateVoteForProposalFee()
    await this.api.transferBalanceToAccounts(this.treasury, this.councilKeyPairs, runtimeVoteFee)
    const announcingPeriod: BN = new BN(28800)
    const votingPeriod: BN = new BN(14400)
    const revealingPeriod: BN = new BN(14400)
    const councilSize: BN = await this.api.getCouncilSize()
    const candidacyLimit: BN = await this.api.getCandidacyLimit()
    const newTermDuration: BN = new BN(144000)
    const minCouncilStake: BN = await this.api.getMinCouncilStake()
    const minVotingStake: BN = await this.api.getMinVotingStake()

    // Proposal stake calculation
    const proposalStake: BN = new BN(200000)
    const proposalFee: BN = this.api.estimateProposeElectionParametersFee(
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
    await this.api.transferBalance(this.treasury, this.membersKeyPairs[0].address, proposalFee.add(proposalStake))

    // Proposal creation
    const proposedAnnouncingPeriod: BN = announcingPeriod.subn(1)
    const proposedVotingPeriod: BN = votingPeriod.addn(1)
    const proposedRevealingPeriod: BN = revealingPeriod.addn(1)
    const proposedCouncilSize: BN = councilSize.addn(1)
    const proposedCandidacyLimit: BN = candidacyLimit.addn(1)
    const proposedNewTermDuration: BN = newTermDuration.addn(1)
    const proposedMinCouncilStake: BN = minCouncilStake.addn(1)
    const proposedMinVotingStake: BN = minVotingStake.addn(1)
    const proposalPromise: Promise<ProposalId> = this.api.expectProposalCreated()
    await this.api.proposeElectionParameters(
      this.membersKeyPairs[0],
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
    const proposalExecutionPromise: Promise<void> = this.api.expectProposalFinalized()
    await this.api.batchApproveProposal(this.councilKeyPairs, proposalNumber)
    await proposalExecutionPromise

    // Assertions
    const newAnnouncingPeriod: BN = await this.api.getAnnouncingPeriod()
    const newVotingPeriod: BN = await this.api.getVotingPeriod()
    const newRevealingPeriod: BN = await this.api.getRevealingPeriod()
    const newCouncilSize: BN = await this.api.getCouncilSize()
    const newCandidacyLimit: BN = await this.api.getCandidacyLimit()
    const newNewTermDuration: BN = await this.api.getNewTermDuration()
    const newMinCouncilStake: BN = await this.api.getMinCouncilStake()
    const newMinVotingStake: BN = await this.api.getMinVotingStake()
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

export class SpendingProposalFixture implements Fixture {
  private api: Api
  private membersKeyPairs: KeyringPair[]
  private councilKeyPairs: KeyringPair[]
  private sudo: KeyringPair
  private spendingBalance: BN
  private mintCapacity: BN

  constructor(
    api: Api,
    membersKeyPairs: KeyringPair[],
    councilKeyPairs: KeyringPair[],
    sudo: KeyringPair,
    spendingBalance: BN,
    mintCapacity: BN
  ) {
    this.api = api
    this.membersKeyPairs = membersKeyPairs
    this.councilKeyPairs = councilKeyPairs
    this.sudo = sudo
    this.spendingBalance = spendingBalance
    this.mintCapacity = mintCapacity
  }

  public async runner(expectFailure: boolean): Promise<void> {
    // Setup
    const description = 'spending proposal which is used for API network testing with some mock data'
    const runtimeVoteFee: BN = this.api.estimateVoteForProposalFee()

    // Topping the balances
    const proposalStake: BN = new BN(25000)
    const runtimeProposalFee: BN = this.api.estimateProposeSpendingFee(
      description,
      description,
      proposalStake,
      this.spendingBalance,
      this.sudo.address
    )
    await this.api.transferBalance(this.sudo, this.membersKeyPairs[0].address, runtimeProposalFee.add(proposalStake))
    await this.api.transferBalanceToAccounts(this.sudo, this.councilKeyPairs, runtimeVoteFee)
    await this.api.sudoSetCouncilMintCapacity(this.sudo, this.mintCapacity)

    // Proposal creation
    const proposalPromise: Promise<ProposalId> = this.api.expectProposalCreated()
    await this.api.proposeSpending(
      this.membersKeyPairs[0],
      'testing spending' + uuid().substring(0, 8),
      'spending to test proposal functionality' + uuid().substring(0, 8),
      proposalStake,
      this.spendingBalance,
      this.sudo.address
    )
    const proposalNumber: ProposalId = await proposalPromise

    // Approving spending proposal
    const balanceBeforeMinting: BN = await this.api.getBalance(this.sudo.address)
    const spendingPromise: Promise<void> = this.api.expectProposalFinalized()
    await this.api.batchApproveProposal(this.councilKeyPairs, proposalNumber)
    await spendingPromise
    const balanceAfterMinting: BN = await this.api.getBalance(this.sudo.address)
    assert(
      balanceAfterMinting.sub(balanceBeforeMinting).eq(this.spendingBalance),
      `member ${
        this.membersKeyPairs[0].address
      } has unexpected balance ${balanceAfterMinting}, expected ${balanceBeforeMinting.add(this.spendingBalance)}`
    )
    if (expectFailure) {
      throw new Error('Successful fixture run while expecting failure')
    }
  }
}

export class TextProposalFixture implements Fixture {
  private api: Api
  private membersKeyPairs: KeyringPair[]
  private councilKeyPairs: KeyringPair[]
  private treasury: KeyringPair

  constructor(api: Api, membersKeyPairs: KeyringPair[], councilKeyPairs: KeyringPair[], treasury: KeyringPair) {
    this.api = api
    this.membersKeyPairs = membersKeyPairs
    this.councilKeyPairs = councilKeyPairs
    this.treasury = treasury
  }

  public async runner(expectFailure: boolean): Promise<void> {
    // Setup
    const proposalTitle: string = 'Testing proposal ' + uuid().substring(0, 8)
    const description: string = 'Testing text proposal ' + uuid().substring(0, 8)
    const proposalText: string = 'Text of the testing proposal ' + uuid().substring(0, 8)
    const runtimeVoteFee: BN = this.api.estimateVoteForProposalFee()
    await this.api.transferBalanceToAccounts(this.treasury, this.councilKeyPairs, runtimeVoteFee)

    // Proposal stake calculation
    const proposalStake: BN = new BN(25000)
    const runtimeProposalFee: BN = this.api.estimateProposeTextFee(
      proposalStake,
      description,
      description,
      proposalText
    )
    await this.api.transferBalance(
      this.treasury,
      this.membersKeyPairs[0].address,
      runtimeProposalFee.add(proposalStake)
    )

    // Proposal creation
    const proposalPromise: Promise<ProposalId> = this.api.expectProposalCreated()
    await this.api.proposeText(this.membersKeyPairs[0], proposalStake, proposalTitle, description, proposalText)
    const proposalNumber: ProposalId = await proposalPromise

    // Approving text proposal
    const textProposalPromise: Promise<void> = this.api.expectProposalFinalized()
    await this.api.batchApproveProposal(this.councilKeyPairs, proposalNumber)
    await textProposalPromise
    if (expectFailure) {
      throw new Error('Successful fixture run while expecting failure')
    }
  }
}

export class ValidatorCountProposalFixture implements Fixture {
  private api: Api
  private membersKeyPairs: KeyringPair[]
  private councilKeyPairs: KeyringPair[]
  private treasury: KeyringPair
  private validatorCountIncrement: BN

  constructor(
    api: Api,
    membersKeyPairs: KeyringPair[],
    councilKeyPairs: KeyringPair[],
    treasury: KeyringPair,
    validatorCountIncrement: BN
  ) {
    this.api = api
    this.membersKeyPairs = membersKeyPairs
    this.councilKeyPairs = councilKeyPairs
    this.treasury = treasury
    this.validatorCountIncrement = validatorCountIncrement
  }

  public async runner(expectFailure: boolean): Promise<void> {
    // Setup
    const proposalTitle: string = 'Testing proposal ' + uuid().substring(0, 8)
    const description: string = 'Testing validator count proposal ' + uuid().substring(0, 8)
    const runtimeVoteFee: BN = this.api.estimateVoteForProposalFee()
    await this.api.transferBalanceToAccounts(this.treasury, this.councilKeyPairs, runtimeVoteFee)

    // Proposal stake calculation
    const proposalStake: BN = new BN(100000)
    const proposalFee: BN = this.api.estimateProposeValidatorCountFee(description, description, proposalStake)
    await this.api.transferBalance(this.treasury, this.membersKeyPairs[0].address, proposalFee.add(proposalStake))
    const validatorCount: BN = await this.api.getValidatorCount()

    // Proposal creation
    const proposedValidatorCount: BN = validatorCount.add(this.validatorCountIncrement)
    const proposalPromise: Promise<ProposalId> = this.api.expectProposalCreated()
    await this.api.proposeValidatorCount(
      this.membersKeyPairs[0],
      proposalTitle,
      description,
      proposalStake,
      proposedValidatorCount
    )
    const proposalNumber: ProposalId = await proposalPromise

    // Approving the proposal
    const proposalExecutionPromise: Promise<void> = this.api.expectProposalFinalized()
    await this.api.batchApproveProposal(this.councilKeyPairs, proposalNumber)
    await proposalExecutionPromise
    const newValidatorCount: BN = await this.api.getValidatorCount()
    assert(
      proposedValidatorCount.eq(newValidatorCount),
      `Validator count has unexpeccted value ${newValidatorCount}, expected ${proposedValidatorCount}`
    )
    if (expectFailure) {
      throw new Error('Successful fixture run while expecting failure')
    }
  }
}

export class UpdateRuntimeFixture implements Fixture {
  private api: Api
  private membersKeyPairs: KeyringPair[]
  private councilKeyPairs: KeyringPair[]
  private treasury: KeyringPair
  private runtimePath: string

  constructor(
    api: Api,
    membersKeyPairs: KeyringPair[],
    councilKeyPairs: KeyringPair[],
    treasury: KeyringPair,
    runtimePath: string
  ) {
    this.api = api
    this.membersKeyPairs = membersKeyPairs
    this.councilKeyPairs = councilKeyPairs
    this.treasury = treasury
    this.runtimePath = runtimePath
  }

  public async runner(expectFailure: boolean): Promise<void> {
    // Setup
    const runtime: string = Utils.readRuntimeFromFile(this.runtimePath)
    const description = 'runtime upgrade proposal which is used for API network testing'
    const runtimeVoteFee: BN = this.api.estimateVoteForProposalFee()

    // Topping the balances
    const proposalStake: BN = new BN(1000000)
    const runtimeProposalFee: BN = this.api.estimateProposeRuntimeUpgradeFee(
      proposalStake,
      description,
      description,
      runtime
    )
    await this.api.transferBalance(
      this.treasury,
      this.membersKeyPairs[0].address,
      runtimeProposalFee.add(proposalStake)
    )
    await this.api.transferBalanceToAccounts(this.treasury, this.councilKeyPairs, runtimeVoteFee)

    // Proposal creation
    const proposalPromise: Promise<ProposalId> = this.api.expectProposalCreated()
    await this.api.proposeRuntime(
      this.membersKeyPairs[0],
      proposalStake,
      'testing runtime' + uuid().substring(0, 8),
      'runtime to test proposal functionality' + uuid().substring(0, 8),
      runtime
    )
    const proposalNumber: ProposalId = await proposalPromise

    // Approving runtime update proposal
    const runtimePromise: Promise<void> = this.api.expectProposalFinalized()
    await this.api.batchApproveProposal(this.councilKeyPairs, proposalNumber)
    await runtimePromise
    if (expectFailure) {
      throw new Error('Successful fixture run while expecting failure')
    }
  }
}

export class VoteForProposalFixture implements Fixture {
  private api: Api
  private councilKeyPairs: KeyringPair[]
  private treasury: KeyringPair
  private proposalNumber: ProposalId

  constructor(api: Api, councilKeyPairs: KeyringPair[], treasury: KeyringPair, proposalNumber: ProposalId) {
    this.api = api
    this.councilKeyPairs = councilKeyPairs
    this.treasury = treasury
    this.proposalNumber = proposalNumber
  }

  public async runner(expectFailure: boolean): Promise<void> {
    const proposalVoteFee: BN = this.api.estimateVoteForProposalFee()
    await this.api.transferBalanceToAccounts(this.treasury, this.councilKeyPairs, proposalVoteFee)

    // Approving the proposal
    const proposalExecutionPromise: Promise<void> = this.api.expectProposalFinalized()
    await this.api.batchApproveProposal(this.councilKeyPairs, this.proposalNumber)
    await proposalExecutionPromise
    if (expectFailure) {
      throw new Error('Successful fixture run while expecting failure')
    }
  }
}
