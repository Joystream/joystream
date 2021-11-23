import { Api, WorkingGroups } from '../Api'
import { v4 as uuid } from 'uuid'
import BN from 'bn.js'
import { ProposalId } from '@joystream/types/proposals'
import { BaseFixture } from '../Fixture'
import { assert } from 'chai'
import { ApplicationId, OpeningId } from '@joystream/types/hiring'
import { WorkerId } from '@joystream/types/working-group'
import { Utils } from '../utils'
import { EventRecord } from '@polkadot/types/interfaces'

export class CreateWorkingGroupLeaderOpeningFixture extends BaseFixture {
  private proposer: string
  private applicationStake: BN
  private roleStake: BN
  private workingGroup: string

  private result: ProposalId | undefined

  constructor(api: Api, proposer: string, applicationStake: BN, roleStake: BN, workingGroup: string) {
    super(api)
    this.proposer = proposer
    this.applicationStake = applicationStake
    this.roleStake = roleStake
    this.workingGroup = workingGroup
  }

  public getCreatedProposalId(): ProposalId | undefined {
    return this.result
  }

  public async execute(): Promise<void> {
    // Setup
    const proposalTitle: string = 'Testing proposal ' + uuid().substring(0, 8)
    const description: string = 'Testing working group lead opening proposal ' + uuid().substring(0, 8)

    // Proposal stake calculation
    const proposalStake: BN = new BN(100000)
    const proposalFee: BN = this.api.estimateProposeCreateWorkingGroupLeaderOpeningFee()
    this.api.treasuryTransferBalance(this.proposer, proposalFee.add(proposalStake))

    // Proposal creation
    const result = await this.api.proposeCreateWorkingGroupLeaderOpening({
      account: this.proposer,
      title: proposalTitle,
      description: description,
      proposalStake: proposalStake,
      actiavteAt: 'CurrentBlock',
      maxActiveApplicants: new BN(10),
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

    this.result = this.api.findEvent(result, 'proposalsEngine', 'ProposalCreated')?.data[1]
  }
}

export class BeginWorkingGroupLeaderApplicationReviewFixture extends BaseFixture {
  private proposer: string
  private openingId: OpeningId
  private workingGroup: string

  private result: ProposalId | undefined

  constructor(api: Api, proposer: string, openingId: OpeningId, workingGroup: string) {
    super(api)
    this.proposer = proposer
    this.openingId = openingId
    this.workingGroup = workingGroup
  }

  public getCreatedProposalId(): ProposalId | undefined {
    return this.result
  }

  public async execute(): Promise<void> {
    // Setup
    const proposalTitle: string = 'Testing proposal ' + uuid().substring(0, 8)
    const description: string = 'Testing begin working group lead application review proposal ' + uuid().substring(0, 8)

    // Proposal stake calculation
    const proposalStake: BN = new BN(25000)
    const proposalFee: BN = this.api.estimateProposeBeginWorkingGroupLeaderApplicationReviewFee()
    this.api.treasuryTransferBalance(this.proposer, proposalFee.add(proposalStake))

    // Proposal creation
    const result = await this.api.proposeBeginWorkingGroupLeaderApplicationReview(
      this.proposer,
      proposalTitle,
      description,
      proposalStake,
      this.openingId,
      this.workingGroup
    )

    this.result = this.api.findEvent(result, 'proposalsEngine', 'ProposalCreated')?.data[1]
  }
}

export class FillLeaderOpeningProposalFixture extends BaseFixture {
  private proposer: string
  private applicationId: ApplicationId
  private firstRewardInterval: BN
  private rewardInterval: BN
  private payoutAmount: BN
  private openingId: OpeningId
  private workingGroup: WorkingGroups

  private result: ProposalId | undefined

  constructor(
    api: Api,
    proposer: string,
    applicationId: ApplicationId,
    firstRewardInterval: BN,
    rewardInterval: BN,
    payoutAmount: BN,
    openingId: OpeningId,
    workingGroup: WorkingGroups
  ) {
    super(api)
    this.proposer = proposer
    this.applicationId = applicationId
    this.firstRewardInterval = firstRewardInterval
    this.rewardInterval = rewardInterval
    this.payoutAmount = payoutAmount
    this.openingId = openingId
    this.workingGroup = workingGroup
  }

  public getCreatedProposalId(): ProposalId | undefined {
    return this.result
  }

  public async execute(): Promise<void> {
    // Setup
    const proposalTitle: string = 'Testing proposal ' + uuid().substring(0, 8)
    const description: string = 'Testing fill opening proposal ' + uuid().substring(0, 8)
    const workingGroupString: string = this.api.getWorkingGroupString(this.workingGroup)

    // Proposal stake calculation
    const proposalStake: BN = new BN(50000)
    const proposalFee: BN = this.api.estimateProposeFillLeaderOpeningFee()
    this.api.treasuryTransferBalance(this.proposer, proposalFee.add(proposalStake))

    const now: BN = await this.api.getBestBlock()

    // Proposal creation
    const result = await this.api.proposeFillLeaderOpening({
      account: this.proposer,
      title: proposalTitle,
      description: description,
      proposalStake: proposalStake,
      openingId: this.openingId,
      successfulApplicationId: this.applicationId,
      amountPerPayout: this.payoutAmount,
      nextPaymentAtBlock: now.add(this.firstRewardInterval),
      payoutInterval: this.rewardInterval,
      workingGroup: workingGroupString,
    })

    this.result = this.api.findEvent(result, 'proposalsEngine', 'ProposalCreated')?.data[1]
  }
}

export class TerminateLeaderRoleProposalFixture extends BaseFixture {
  private proposer: string
  private slash: boolean
  private workingGroup: WorkingGroups

  private result: ProposalId | undefined

  constructor(api: Api, proposer: string, slash: boolean, workingGroup: WorkingGroups) {
    super(api)
    this.proposer = proposer
    this.slash = slash
    this.workingGroup = workingGroup
  }

  public getCreatedProposalId(): ProposalId | undefined {
    return this.result
  }

  public async execute(): Promise<void> {
    // Setup
    const proposalTitle: string = 'Testing proposal ' + uuid().substring(0, 8)
    const description: string = 'Testing begin working group lead application review proposal ' + uuid().substring(0, 8)
    const rationale: string = 'Testing leader termination ' + uuid().substring(0, 8)
    const workingGroupString: string = this.api.getWorkingGroupString(this.workingGroup)
    // assert worker exists
    const workerId: WorkerId = (await this.api.getLeadWorkerId(this.workingGroup))!

    // Proposal stake calculation
    const proposalStake: BN = new BN(100000)
    const proposalFee: BN = this.api.estimateProposeTerminateLeaderRoleFee()
    this.api.treasuryTransferBalance(this.proposer, proposalFee.add(proposalStake))

    // Proposal creation
    const result = await this.api.proposeTerminateLeaderRole(
      this.proposer,
      proposalTitle,
      description,
      proposalStake,
      workerId,
      rationale,
      this.slash,
      workingGroupString
    )
    this.result = this.api.findEvent(result, 'proposalsEngine', 'ProposalCreated')?.data[1]
  }
}

export class SetLeaderRewardProposalFixture extends BaseFixture {
  private proposer: string
  private payoutAmount: BN
  private workingGroup: WorkingGroups

  private result: ProposalId | undefined

  constructor(api: Api, proposer: string, payoutAmount: BN, workingGroup: WorkingGroups) {
    super(api)
    this.proposer = proposer
    this.payoutAmount = payoutAmount
    this.workingGroup = workingGroup
  }

  public getCreatedProposalId(): ProposalId | undefined {
    return this.result
  }

  public async execute(): Promise<void> {
    // Setup
    const proposalTitle: string = 'Testing proposal ' + uuid().substring(0, 8)
    const description: string = 'Testing set leader reward proposal ' + uuid().substring(0, 8)
    const workingGroupString: string = this.api.getWorkingGroupString(this.workingGroup)
    // assert worker exists?
    const workerId: WorkerId = (await this.api.getLeadWorkerId(this.workingGroup))!

    // Proposal stake calculation
    const proposalStake: BN = new BN(50000)
    const proposalFee: BN = this.api.estimateProposeLeaderRewardFee()
    this.api.treasuryTransferBalance(this.proposer, proposalFee.add(proposalStake))

    // Proposal creation
    const result = await this.api.proposeLeaderReward(
      this.proposer,
      proposalTitle,
      description,
      proposalStake,
      workerId,
      this.payoutAmount,
      workingGroupString
    )

    this.result = this.api.findEvent(result, 'proposalsEngine', 'ProposalCreated')?.data[1]
  }
}

export class DecreaseLeaderStakeProposalFixture extends BaseFixture {
  private proposer: string
  private stakeDecrement: BN
  private workingGroup: WorkingGroups

  private result: ProposalId | undefined

  constructor(api: Api, proposer: string, stakeDecrement: BN, workingGroup: WorkingGroups) {
    super(api)
    this.proposer = proposer
    this.stakeDecrement = stakeDecrement
    this.workingGroup = workingGroup
  }

  public getCreatedProposalId(): ProposalId | undefined {
    return this.result
  }

  public async execute(): Promise<void> {
    // Setup
    const proposalTitle: string = 'Testing proposal ' + uuid().substring(0, 8)
    const description: string = 'Testing decrease leader stake proposal ' + uuid().substring(0, 8)
    const workingGroupString: string = this.api.getWorkingGroupString(this.workingGroup)
    // assert worker exists ?
    const workerId: WorkerId = (await this.api.getLeadWorkerId(this.workingGroup))!

    // Proposal stake calculation
    const proposalStake: BN = new BN(50000)
    const proposalFee: BN = this.api.estimateProposeDecreaseLeaderStakeFee()
    this.api.treasuryTransferBalance(this.proposer, proposalFee.add(proposalStake))

    // Proposal creation
    const result = await this.api.proposeDecreaseLeaderStake(
      this.proposer,
      proposalTitle,
      description,
      proposalStake,
      workerId,
      this.stakeDecrement,
      workingGroupString
    )

    this.result = this.api.findEvent(result, 'proposalsEngine', 'ProposalCreated')?.data[1]
  }
}

export class SlashLeaderProposalFixture extends BaseFixture {
  private proposer: string
  private slashAmount: BN
  private workingGroup: WorkingGroups

  private result: ProposalId | undefined

  constructor(api: Api, proposer: string, slashAmount: BN, workingGroup: WorkingGroups) {
    super(api)
    this.proposer = proposer
    this.slashAmount = slashAmount
    this.workingGroup = workingGroup
  }

  public getCreatedProposalId(): ProposalId | undefined {
    return this.result
  }

  public async execute(): Promise<void> {
    // Setup
    const proposalTitle: string = 'Testing proposal ' + uuid().substring(0, 8)
    const description: string = 'Testing slash leader stake proposal ' + uuid().substring(0, 8)
    const workingGroupString: string = this.api.getWorkingGroupString(this.workingGroup)
    const workerId: WorkerId = (await this.api.getLeadWorkerId(this.workingGroup))!

    // Proposal stake calculation
    const proposalStake: BN = new BN(50000)
    const proposalFee: BN = this.api.estimateProposeSlashLeaderStakeFee()
    this.api.treasuryTransferBalance(this.proposer, proposalFee.add(proposalStake))

    // Proposal creation
    const result = await this.api.proposeSlashLeaderStake(
      this.proposer,
      proposalTitle,
      description,
      proposalStake,
      workerId,
      this.slashAmount,
      workingGroupString
    )
    this.result = this.api.findEvent(result, 'proposalsEngine', 'ProposalCreated')?.data[1]
  }
}

export class WorkingGroupMintCapacityProposalFixture extends BaseFixture {
  private proposer: string
  private mintCapacity: BN
  private workingGroup: WorkingGroups

  private result: ProposalId | undefined

  constructor(api: Api, proposer: string, mintCapacity: BN, workingGroup: WorkingGroups) {
    super(api)
    this.proposer = proposer
    this.mintCapacity = mintCapacity
    this.workingGroup = workingGroup
  }

  public getCreatedProposalId(): ProposalId | undefined {
    return this.result
  }

  public async execute(): Promise<void> {
    // Setup
    const proposalTitle: string = 'Testing proposal ' + uuid().substring(0, 8)
    const description: string = 'Testing working group mint capacity proposal ' + uuid().substring(0, 8)
    const workingGroupString: string = this.api.getWorkingGroupString(this.workingGroup)

    // Proposal stake calculation
    const proposalStake: BN = new BN(50000)
    const proposalFee: BN = this.api.estimateProposeWorkingGroupMintCapacityFee()
    this.api.treasuryTransferBalance(this.proposer, proposalFee.add(proposalStake))

    // Proposal creation
    const result = await this.api.proposeWorkingGroupMintCapacity(
      this.proposer,
      proposalTitle,
      description,
      proposalStake,
      this.mintCapacity,
      workingGroupString
    )
    this.result = this.api.findEvent(result, 'proposalsEngine', 'ProposalCreated')?.data[1]
  }
}

export class ElectionParametersProposalFixture extends BaseFixture {
  private proposerAccount: string

  constructor(api: Api, proposerAccount: string) {
    super(api)
    this.proposerAccount = proposerAccount
  }

  public async execute(): Promise<void> {
    // Setup
    const proposalTitle: string = 'Testing proposal ' + uuid().substring(0, 8)
    const description: string = 'Testing Election Parameters proposal ' + uuid().substring(0, 8)

    const announcingPeriod: BN = new BN(1)
    const votingPeriod: BN = new BN(1)
    const revealingPeriod: BN = new BN(1)
    const councilSize: BN = new BN(1)
    const candidacyLimit: BN = new BN(1)
    const newTermDuration: BN = new BN(1)
    const minCouncilStake: BN = new BN(1)
    const minVotingStake: BN = new BN(1)

    // Proposal stake calculation
    // Required stake is hardcoded in runtime-module (but not available as const)
    const proposalStake: BN = new BN(1000000)
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

    this.api.treasuryTransferBalance(this.proposerAccount, proposalFee.add(proposalStake))

    // Proposal creation
    const proposedAnnouncingPeriod: BN = new BN(43199)
    const proposedVotingPeriod: BN = new BN(28799)
    const proposedRevealingPeriod: BN = new BN(28799)
    const proposedCouncilSize: BN = new BN(39)
    const proposedCandidacyLimit: BN = new BN(199)
    const proposedNewTermDuration: BN = new BN(143999)
    const proposedMinCouncilStake: BN = new BN(99999)
    const proposedMinVotingStake: BN = new BN(99999)

    const proposalCreationResult = await this.api.proposeElectionParameters(
      this.proposerAccount,
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

    const proposalNumber = this.api.getEvent(proposalCreationResult, 'proposalsEngine', 'ProposalCreated').data[1]

    const approveProposalFixture = new VoteForProposalFixture(this.api, proposalNumber)
    await approveProposalFixture.execute()

    assert(approveProposalFixture.proposalExecuted)

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
  }
}

export class SpendingProposalFixture extends BaseFixture {
  private proposer: string
  private spendingBalance: BN
  private mintCapacity: BN

  constructor(api: Api, proposer: string, spendingBalance: BN, mintCapacity: BN) {
    super(api)
    this.proposer = proposer
    this.spendingBalance = spendingBalance
    this.mintCapacity = mintCapacity
  }

  public async execute(): Promise<void> {
    // Setup
    const description = 'spending proposal which is used for API network testing with some mock data'

    // Topping the balances
    const proposalStake: BN = new BN(25000)
    const runtimeProposalFee: BN = this.api.estimateProposeSpendingFee(
      description,
      description,
      proposalStake,
      this.spendingBalance,
      this.proposer
    )
    this.api.treasuryTransferBalance(this.proposer, runtimeProposalFee.add(proposalStake))

    await this.api.sudoSetCouncilMintCapacity(this.mintCapacity)

    const fundingRecipient = this.api.createKeyPairs(1)[0].address

    // Proposal creation
    const result = await this.api.proposeSpending(
      this.proposer,
      'testing spending' + uuid().substring(0, 8),
      'spending to test proposal functionality' + uuid().substring(0, 8),
      proposalStake,
      this.spendingBalance,
      fundingRecipient
    )
    const proposalNumber = this.api.getEvent(result, 'proposalsEngine', 'ProposalCreated')?.data[1]

    // Approving spending proposal
    const balanceBeforeMinting: BN = await this.api.getBalance(fundingRecipient)

    const approveProposalFixture = new VoteForProposalFixture(this.api, proposalNumber)
    await approveProposalFixture.execute()
    assert(approveProposalFixture.proposalExecuted)

    const balanceAfterMinting: BN = await this.api.getBalance(fundingRecipient)
    assert(
      balanceAfterMinting.eq(balanceBeforeMinting.add(this.spendingBalance)),
      `member ${fundingRecipient} has unexpected balance ${balanceAfterMinting}, expected ${balanceBeforeMinting.add(
        this.spendingBalance
      )}`
    )
  }
}

export class TextProposalFixture extends BaseFixture {
  private proposer: string

  constructor(api: Api, proposer: string) {
    super(api)
    this.proposer = proposer
  }

  public async execute(): Promise<void> {
    // Setup
    const proposalTitle: string = 'Testing proposal ' + uuid().substring(0, 8)
    const description: string = 'Testing text proposal ' + uuid().substring(0, 8)
    const proposalText: string = 'Text of the testing proposal ' + uuid().substring(0, 8)

    // Proposal stake calculation
    const proposalStake: BN = new BN(25000)
    const runtimeProposalFee: BN = this.api.estimateProposeTextFee(
      proposalStake,
      description,
      description,
      proposalText
    )
    this.api.treasuryTransferBalance(this.proposer, runtimeProposalFee.add(proposalStake))

    // Proposal creation
    const result = await this.api.proposeText(this.proposer, proposalStake, proposalTitle, description, proposalText)
    const proposalNumber = this.api.getEvent(result, 'proposalsEngine', 'ProposalCreated')?.data[1]

    // Approving text proposal
    const approveProposalFixture = new VoteForProposalFixture(this.api, proposalNumber)
    await approveProposalFixture.execute()
    assert(approveProposalFixture.proposalExecuted)
  }
}

export class ValidatorCountProposalFixture extends BaseFixture {
  private proposer: string
  private proposedValidatorCount: BN

  constructor(api: Api, proposer: string, validatorCount: BN) {
    super(api)
    this.proposer = proposer
    this.proposedValidatorCount = validatorCount
  }

  public async execute(): Promise<void> {
    // Setup
    const proposalTitle: string = 'Testing proposal ' + uuid().substring(0, 8)
    const description: string = 'Testing validator count proposal ' + uuid().substring(0, 8)

    // Proposal stake calculation
    const proposalStake: BN = new BN(500000)
    const proposalFee: BN = this.api.estimateProposeValidatorCountFee(description, description, proposalStake)
    this.api.treasuryTransferBalance(this.proposer, proposalFee.add(proposalStake))
    const currentValidatorCount: BN = await this.api.getValidatorCount()

    // Proposal creation
    // Make sure proposed is different than current to ensure change is applied.
    assert(!currentValidatorCount.eq(this.proposedValidatorCount))

    const result = await this.api.proposeValidatorCount(
      this.proposer,
      proposalTitle,
      description,
      proposalStake,
      this.proposedValidatorCount
    )
    const proposalNumber = this.api.getEvent(result, 'proposalsEngine', 'ProposalCreated')?.data[1]

    // Approving the proposal
    const approveProposalFixture = new VoteForProposalFixture(this.api, proposalNumber)
    await approveProposalFixture.execute()
    assert(approveProposalFixture.proposalExecuted)

    const newValidatorCount: BN = await this.api.getValidatorCount()
    assert(
      this.proposedValidatorCount.eq(newValidatorCount),
      `Validator count has unexpeccted value ${newValidatorCount}, expected ${this.proposedValidatorCount}`
    )
  }
}

export class UpdateRuntimeFixture extends BaseFixture {
  private proposer: string
  private runtimePath: string

  constructor(api: Api, proposer: string, runtimePath: string) {
    super(api)
    this.proposer = proposer
    this.runtimePath = runtimePath
  }

  public async execute(): Promise<void> {
    // Setup
    const runtime: string = Utils.readRuntimeFromFile(this.runtimePath)
    const description = 'runtime upgrade proposal which is used for API network testing'

    // Topping the balances
    const proposalStake: BN = new BN(1000000)
    const runtimeProposalFee: BN = this.api.estimateProposeRuntimeUpgradeFee(
      proposalStake,
      description,
      description,
      runtime
    )
    this.api.treasuryTransferBalance(this.proposer, runtimeProposalFee.add(proposalStake))

    // Proposal creation
    const result = await this.api.proposeRuntime(
      this.proposer,
      proposalStake,
      'testing runtime' + uuid().substring(0, 8),
      'runtime to test proposal functionality' + uuid().substring(0, 8),
      runtime
    )
    const proposalNumber = this.api.getEvent(result, 'proposalsEngine', 'ProposalCreated')?.data[1]

    // Approving runtime update proposal
    const approveProposalFixture = new VoteForProposalFixture(this.api, proposalNumber)
    await approveProposalFixture.execute()
    assert(approveProposalFixture.proposalExecuted)
  }
}

export class VoteForProposalFixture extends BaseFixture {
  private proposalNumber: ProposalId
  private _proposalExecuted = false
  private _events: EventRecord[] = []

  constructor(api: Api, proposalNumber: ProposalId) {
    super(api)
    this.proposalNumber = proposalNumber
  }

  get proposalExecuted(): boolean {
    return this._proposalExecuted
  }

  get events(): EventRecord[] {
    return this._events
  }

  public async execute(): Promise<void> {
    const proposalVoteFee: BN = this.api.estimateVoteForProposalFee()
    const councilAccounts = await this.api.getCouncilAccounts()
    this.api.treasuryTransferBalanceToAccounts(councilAccounts, proposalVoteFee)

    // Catch the proposal execution result
    const proposalExecutionResult = await this.api.subscribeToProposalExecutionResult(this.proposalNumber)

    // Approve proposal
    // const approvals =
    await this.api.batchApproveProposal(this.proposalNumber)

    // Depending on the "approval_threshold_percentage" paramater for the proposal type, it might happen
    // that the proposal can pass before all votes are cast, and this can result in an approval vote
    // failing with a 'ProposalFinalized' Dispatch error. Important to note that depending on how many
    // votes make it into a block, it may not always manifest becasuse the check for proposal finalization
    // happens in on_finalize. So we no longer assert that all vote dispatches are successful.
    // "Not taking this into account has resulted in tests failing undeterminisctly in the past.."
    // approvals.map((result) => this.expectDispatchSuccess(result, 'Proposal Approval Vote Expected To Be Successful'))

    // Wait for the proposal to finalize
    const proposalOutcome = await proposalExecutionResult.promise
    this._proposalExecuted = proposalOutcome[0]
    this._events = proposalOutcome[1]
  }
}

export class VoteForProposalAndExpectExecutionFixture extends VoteForProposalFixture {
  public async execute(): Promise<void> {
    await super.execute()
    if (!this.proposalExecuted) {
      this.error(new Error('Proposal Expected to be executed'))
    }
  }
}
