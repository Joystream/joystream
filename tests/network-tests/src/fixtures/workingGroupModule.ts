import BN from 'bn.js'
import { assert } from 'chai'
import { Api, WorkingGroups } from '../Api'
import { KeyringPair } from '@polkadot/keyring/types'
import { v4 as uuid } from 'uuid'
import { RewardRelationship } from '@joystream/types/recurring-rewards'
import { Application, ApplicationIdToWorkerIdMap, Worker, WorkerId } from '@joystream/types/working-group'
import { Utils } from '../utils'
import { ApplicationId, Opening as HiringOpening, OpeningId } from '@joystream/types/hiring'
import { BaseFixture, FixtureRunner } from '../Fixture'
import { BuyMembershipHappyCaseFixture } from './membershipModule'

export class AddWorkerOpeningFixture extends BaseFixture {
  private applicationStake: BN
  private roleStake: BN
  private activationDelay: BN
  private unstakingPeriod: BN
  private module: WorkingGroups

  private result: OpeningId | undefined

  public getCreatedOpeningId(): OpeningId | undefined {
    return this.result
  }

  public constructor(
    api: Api,
    applicationStake: BN,
    roleStake: BN,
    activationDelay: BN,
    unstakingPeriod: BN,
    module: WorkingGroups
  ) {
    super(api)
    this.applicationStake = applicationStake
    this.roleStake = roleStake
    this.activationDelay = activationDelay
    this.unstakingPeriod = unstakingPeriod
    this.module = module
  }

  public async execute(): Promise<void> {
    const lead = await this.api.getGroupLead(this.module)
    if (!lead) {
      throw new Error('No Lead')
    }
    // Fee estimation and transfer
    const addOpeningFee: BN = this.api.estimateAddOpeningFee(this.module)
    this.api.treasuryTransferBalance(lead.role_account_id.toString(), addOpeningFee)

    // Worker opening creation
    const result = await this.api.addOpening(
      lead.role_account_id.toString(),
      {
        activationDelay: this.activationDelay,
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
        fillOpeningSuccessfulApplicantApplicationStakeUnstakingPeriod: this.unstakingPeriod,
        fillOpeningFailedApplicantApplicationStakeUnstakingPeriod: this.unstakingPeriod,
        fillOpeningFailedApplicantRoleStakeUnstakingPeriod: this.unstakingPeriod,
        terminateApplicationStakeUnstakingPeriod: this.unstakingPeriod,
        terminateRoleStakeUnstakingPeriod: this.unstakingPeriod,
        exitRoleApplicationStakeUnstakingPeriod: this.unstakingPeriod,
        exitRoleStakeUnstakingPeriod: this.unstakingPeriod,
        text: uuid().substring(0, 8),
        type: 'Worker',
      },
      this.module
    )

    // We don't assert, we allow potential failure
    this.result = this.api.findEvent(result, this.module, 'OpeningAdded')?.data[0]
  }
}

export class SudoAddLeaderOpeningFixture extends BaseFixture {
  private applicationStake: BN
  private roleStake: BN
  private activationDelay: BN
  private module: WorkingGroups

  private result: OpeningId | undefined

  public getCreatedOpeningId(): OpeningId | undefined {
    return this.result
  }

  public constructor(api: Api, applicationStake: BN, roleStake: BN, activationDelay: BN, module: WorkingGroups) {
    super(api)
    this.applicationStake = applicationStake
    this.roleStake = roleStake
    this.activationDelay = activationDelay
    this.module = module
  }

  public async execute(): Promise<void> {
    const result = await this.api.sudoAddOpening(
      {
        activationDelay: this.activationDelay,
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
        type: 'Leader',
      },
      this.module
    )

    // We don't assert, we allow potential failure
    this.result = this.api.findEvent(result, this.module, 'OpeningAdded')?.data[0]
  }
}

export class AcceptApplicationsFixture extends BaseFixture {
  private openingId: OpeningId
  private module: WorkingGroups

  public constructor(api: Api, openingId: OpeningId, module: WorkingGroups) {
    super(api)
    this.openingId = openingId
    this.module = module
  }

  public async execute(): Promise<void> {
    const lead = await this.api.getGroupLead(this.module)
    if (!lead) {
      throw new Error('No Lead')
    }
    const leadAccount = lead.role_account_id.toString()
    // Fee estimation and transfer
    const acceptApplicationsFee: BN = this.api.estimateAcceptApplicationsFee(this.module)
    this.api.treasuryTransferBalance(leadAccount, acceptApplicationsFee)

    // Begin accepting applications
    await this.api.acceptApplications(leadAccount, this.openingId, this.module)
    const wgOpening = await this.api.getWorkingGroupOpening(this.openingId, this.module)
    const opening: HiringOpening = await this.api.getHiringOpening(wgOpening.hiring_opening_id)
    assert(opening.is_active, `${this.module} Opening ${this.openingId} is not active`)
  }
}

export class ApplyForOpeningFixture extends BaseFixture {
  private applicants: string[]
  private applicationStake: BN
  private roleStake: BN
  private openingId: OpeningId
  private module: WorkingGroups
  private result: ApplicationId[] = []

  public constructor(
    api: Api,
    applicants: string[],
    applicationStake: BN,
    roleStake: BN,
    openingId: OpeningId,
    module: WorkingGroups
  ) {
    super(api)
    this.applicants = applicants
    this.applicationStake = applicationStake
    this.roleStake = roleStake
    this.openingId = openingId
    this.module = module
  }

  public getApplicationIds(): ApplicationId[] {
    return this.result
  }

  public async execute(): Promise<void> {
    // Fee estimation and transfer
    const applyOnOpeningFee: BN = this.api
      .estimateApplyOnOpeningFee(this.applicants[0], this.module)
      .add(this.applicationStake)
      .add(this.roleStake)
    this.api.treasuryTransferBalanceToAccounts(this.applicants, applyOnOpeningFee)

    // Applying for created worker opening
    const results = await this.api.batchApplyOnOpening(
      this.applicants,
      this.openingId,
      this.roleStake,
      this.applicationStake,
      uuid().substring(0, 8),
      this.module
    )

    const applicationIds = results.map(({ events }) => {
      const record = events.find(
        (record) => record.event.method && record.event.method.toString() === 'AppliedOnOpening'
      )
      if (record) {
        return (record.event.data[1] as unknown) as ApplicationId
      }
      throw new Error('Application on opening failed')
    })

    this.result = applicationIds
  }
}

export class WithdrawApplicationFixture extends BaseFixture {
  private applicationIds: ApplicationId[]
  private module: WorkingGroups

  constructor(api: Api, applicationIds: ApplicationId[], module: WorkingGroups) {
    super(api)
    this.applicationIds = applicationIds
    this.module = module
  }

  public async execute(): Promise<void> {
    // Fee estimation and transfer
    const withdrawApplicaitonFee: BN = this.api.estimateWithdrawApplicationFee(this.module)

    // get role accounts of applicants
    const roleAccounts = await this.api.getApplicantRoleAccounts(this.applicationIds, this.module)
    this.api.treasuryTransferBalanceToAccounts(roleAccounts, withdrawApplicaitonFee)

    // Application withdrawal
    const withdrawls = await this.api.batchWithdrawActiveApplications(this.applicationIds, this.module)
    withdrawls.forEach((withdrawl) =>
      this.expectDispatchSuccess(withdrawl, 'Application withdrawl should have succeedeed')
    )
  }
}

export class BeginApplicationReviewFixture extends BaseFixture {
  private openingId: OpeningId
  private module: WorkingGroups

  constructor(api: Api, openingId: OpeningId, module: WorkingGroups) {
    super(api)
    this.openingId = openingId
    this.module = module
  }

  public async execute(): Promise<void> {
    const lead = await this.api.getGroupLead(this.module)
    if (!lead) {
      throw new Error('No Lead')
    }
    const leadAccount = lead.role_account_id.toString()
    // Fee estimation and transfer
    const beginReviewFee: BN = this.api.estimateBeginApplicantReviewFee(this.module)
    this.api.treasuryTransferBalance(leadAccount, beginReviewFee)

    // Begin application review
    // const beginApplicantReviewPromise: Promise<ApplicationId> = this.api.expectApplicationReviewBegan()
    const result = await this.api.beginApplicantReview(leadAccount, this.openingId, this.module)

    this.api.getEvent(result, this.module, 'BeganApplicationReview')
  }
}

export class SudoBeginLeaderApplicationReviewFixture extends BaseFixture {
  private openingId: OpeningId
  private module: WorkingGroups

  constructor(api: Api, openingId: OpeningId, module: WorkingGroups) {
    super(api)
    this.openingId = openingId
    this.module = module
  }

  public async execute(): Promise<void> {
    // Begin application review
    await this.api.sudoBeginApplicantReview(this.openingId, this.module)
  }
}

export class FillOpeningFixture extends BaseFixture {
  private applicationIds: ApplicationId[]
  private openingId: OpeningId
  private firstPayoutInterval: BN
  private payoutInterval: BN
  private amountPerPayout: BN
  private module: WorkingGroups
  private workerIds: WorkerId[] = []

  constructor(
    api: Api,
    applicationIds: ApplicationId[],
    openingId: OpeningId,
    firstPayoutInterval: BN,
    payoutInterval: BN,
    amountPerPayout: BN,
    module: WorkingGroups
  ) {
    super(api)
    this.applicationIds = applicationIds
    this.openingId = openingId
    this.firstPayoutInterval = firstPayoutInterval
    this.payoutInterval = payoutInterval
    this.amountPerPayout = amountPerPayout
    this.module = module
  }

  public getWorkerIds(): WorkerId[] {
    return this.workerIds
  }

  public async execute(): Promise<void> {
    const lead = await this.api.getGroupLead(this.module)
    if (!lead) {
      throw new Error('No Lead')
    }
    const leadAccount = lead.role_account_id.toString()
    // Fee estimation and transfer
    const beginReviewFee: BN = this.api.estimateFillOpeningFee(this.module)
    this.api.treasuryTransferBalance(leadAccount, beginReviewFee)

    // Assert max number of workers is not exceeded
    const activeWorkersCount: BN = await this.api.getActiveWorkersCount(this.module)
    const maxWorkersCount: BN = this.api.getMaxWorkersCount(this.module)
    assert(
      activeWorkersCount.addn(this.applicationIds.length).lte(maxWorkersCount),
      `The number of workers ${activeWorkersCount.addn(
        this.applicationIds.length
      )} will exceed max workers count ${maxWorkersCount}`
    )

    // Fill worker opening
    const now: BN = await this.api.getBestBlock()
    const result = await this.api.fillOpening(
      leadAccount,
      this.openingId,
      this.applicationIds,
      this.amountPerPayout,
      now.add(this.firstPayoutInterval),
      this.payoutInterval,
      this.module
    )
    const applicationIdToWorkerIdMap = this.api.getEvent(result, this.module, 'OpeningFilled').data[1]

    this.workerIds = []
    applicationIdToWorkerIdMap.forEach((workerId) => this.workerIds.push(workerId))

    // Assertions
    applicationIdToWorkerIdMap.forEach(async (workerId, applicationId) => {
      const worker: Worker = await this.api.getWorkerById(workerId, this.module)
      const application: Application = await this.api.getApplicationById(applicationId, this.module)
      assert(
        worker.role_account_id.toString() === application.role_account_id.toString(),
        `Role account ids does not match, worker account: ${worker.role_account_id}, application account ${application.role_account_id}`
      )
    })
  }
}

export class SudoFillLeaderOpeningFixture extends BaseFixture {
  private applicationId: ApplicationId
  private openingId: OpeningId
  private firstPayoutInterval: BN
  private payoutInterval: BN
  private amountPerPayout: BN
  private module: WorkingGroups

  constructor(
    api: Api,
    applicationId: ApplicationId,
    openingId: OpeningId,
    firstPayoutInterval: BN,
    payoutInterval: BN,
    amountPerPayout: BN,
    module: WorkingGroups
  ) {
    super(api)
    this.applicationId = applicationId
    this.openingId = openingId
    this.firstPayoutInterval = firstPayoutInterval
    this.payoutInterval = payoutInterval
    this.amountPerPayout = amountPerPayout
    this.module = module
  }

  public async execute(): Promise<void> {
    // Fill leader opening
    const now: BN = await this.api.getBestBlock()
    const result = await this.api.sudoFillOpening(
      this.openingId,
      [this.applicationId],
      this.amountPerPayout,
      now.add(this.firstPayoutInterval),
      this.payoutInterval,
      this.module
    )

    // Assertions
    const applicationIdToWorkerIdMap = this.api.getEvent(result, this.module, 'OpeningFilled').data[1]
    assert.equal(applicationIdToWorkerIdMap.size, 1)

    applicationIdToWorkerIdMap.forEach(async (workerId, applicationId) => {
      const worker: Worker = await this.api.getWorkerById(workerId, this.module)
      const application: Application = await this.api.getApplicationById(applicationId, this.module)
      const leadWorkerId = (await this.api.getLeadWorkerId(this.module)) as WorkerId
      assert.notEqual(leadWorkerId, undefined)
      assert(
        worker.role_account_id.toString() === application.role_account_id.toString(),
        `Role account ids does not match, leader account: ${worker.role_account_id}, application account ${application.role_account_id}`
      )
      assert(
        leadWorkerId.eq(workerId),
        `Role account ids does not match, leader account: ${worker.role_account_id}, application account ${application.role_account_id}`
      )
    })
  }
}

export class IncreaseStakeFixture extends BaseFixture {
  private workerId: WorkerId
  private module: WorkingGroups

  constructor(api: Api, workerId: WorkerId, module: WorkingGroups) {
    super(api)
    this.workerId = workerId
    this.module = module
  }

  public async execute(): Promise<void> {
    // Fee estimation and transfer
    const increaseStakeFee: BN = this.api.estimateIncreaseStakeFee(this.module)
    const stakeIncrement: BN = new BN(1)
    const worker = await this.api.getWorkerById(this.workerId, this.module)
    const workerRoleAccount = worker.role_account_id.toString()
    this.api.treasuryTransferBalance(workerRoleAccount, increaseStakeFee.add(stakeIncrement))

    // Increase worker stake
    const increasedWorkerStake: BN = (await this.api.getWorkerStakeAmount(this.workerId, this.module)).add(
      stakeIncrement
    )
    await this.api.increaseStake(workerRoleAccount, this.workerId, stakeIncrement, this.module)
    const newWorkerStake: BN = await this.api.getWorkerStakeAmount(this.workerId, this.module)
    assert(
      increasedWorkerStake.eq(newWorkerStake),
      `Unexpected worker stake ${newWorkerStake}, expected ${increasedWorkerStake}`
    )
  }
}

export class UpdateRewardAccountFixture extends BaseFixture {
  private workerId: WorkerId
  private module: WorkingGroups

  constructor(api: Api, workerId: WorkerId, module: WorkingGroups) {
    super(api)
    this.workerId = workerId
    this.module = module
  }

  public async execute(): Promise<void> {
    const worker = await this.api.getWorkerById(this.workerId, this.module)
    const workerRoleAccount = worker.role_account_id.toString()
    // Fee estimation and transfer
    const updateRewardAccountFee: BN = this.api.estimateUpdateRewardAccountFee(workerRoleAccount, this.module)
    this.api.treasuryTransferBalance(workerRoleAccount, updateRewardAccountFee)

    // Update reward account
    const createdAccount: KeyringPair = this.api.createKeyPairs(1)[0]
    await this.api.updateRewardAccount(workerRoleAccount, this.workerId, createdAccount.address, this.module)
    const newRewardAccount: string = await this.api.getWorkerRewardAccount(this.workerId, this.module)
    assert(
      newRewardAccount === createdAccount.address,
      `Unexpected role account ${newRewardAccount}, expected ${createdAccount.address}`
    )
  }
}

export class UpdateRoleAccountFixture extends BaseFixture {
  private workerId: WorkerId
  private module: WorkingGroups

  constructor(api: Api, workerId: WorkerId, module: WorkingGroups) {
    super(api)
    this.workerId = workerId
    this.module = module
  }

  public async execute(): Promise<void> {
    const worker = await this.api.getWorkerById(this.workerId, this.module)
    const workerRoleAccount = worker.role_account_id.toString()
    // Fee estimation and transfer
    const updateRoleAccountFee: BN = this.api.estimateUpdateRoleAccountFee(workerRoleAccount, this.module)

    this.api.treasuryTransferBalance(workerRoleAccount, updateRoleAccountFee)

    // Update role account
    const createdAccount: KeyringPair = this.api.createKeyPairs(1)[0]
    await this.api.updateRoleAccount(workerRoleAccount, this.workerId, createdAccount.address, this.module)
    const newRoleAccount: string = (await this.api.getWorkerById(this.workerId, this.module)).role_account_id.toString()
    assert(
      newRoleAccount === createdAccount.address,
      `Unexpected role account ${newRoleAccount}, expected ${createdAccount.address}`
    )
  }
}

export class TerminateApplicationsFixture extends BaseFixture {
  private applicationIds: ApplicationId[]
  private module: WorkingGroups

  constructor(api: Api, applicationIds: ApplicationId[], module: WorkingGroups) {
    super(api)
    this.applicationIds = applicationIds
    this.module = module
  }

  public async execute(): Promise<void> {
    const lead = await this.api.getGroupLead(this.module)
    if (!lead) {
      throw new Error('No Lead')
    }
    const leadAccount = lead.role_account_id.toString()

    // Fee estimation and transfer
    const terminateApplicationFee: BN = this.api.estimateTerminateApplicationFee(this.module)
    this.api.treasuryTransferBalance(leadAccount, terminateApplicationFee.muln(this.applicationIds.length))

    // Terminate worker applications
    const terminations = await this.api.batchTerminateApplication(leadAccount, this.applicationIds, this.module)
    terminations.forEach((termination) =>
      this.expectDispatchSuccess(termination, 'Application should have been terminated')
    )
  }
}

export class DecreaseStakeFixture extends BaseFixture {
  private workerId: WorkerId
  private module: WorkingGroups

  constructor(api: Api, workerId: WorkerId, module: WorkingGroups) {
    super(api)
    this.workerId = workerId
    this.module = module
  }

  public async execute(): Promise<void> {
    const lead = await this.api.getGroupLead(this.module)
    if (!lead) {
      throw new Error('No Lead')
    }
    const leadAccount = lead.role_account_id.toString()

    // Fee estimation and transfer
    const decreaseStakeFee: BN = this.api.estimateDecreaseStakeFee(this.module)
    this.api.treasuryTransferBalance(leadAccount, decreaseStakeFee)
    const workerStakeDecrement: BN = new BN(1)

    // Worker stake decrement
    const decreasedWorkerStake: BN = (await this.api.getWorkerStakeAmount(this.workerId, this.module)).sub(
      workerStakeDecrement
    )
    await this.api.decreaseStake(leadAccount, this.workerId, workerStakeDecrement, this.module)
    const newWorkerStake: BN = await this.api.getWorkerStakeAmount(this.workerId, this.module)

    // Assertions
    assert(
      decreasedWorkerStake.eq(newWorkerStake),
      `Unexpected worker stake ${newWorkerStake}, expected ${decreasedWorkerStake}`
    )
  }
}

export class SlashFixture extends BaseFixture {
  private workerId: WorkerId
  private module: WorkingGroups

  constructor(api: Api, workerId: WorkerId, module: WorkingGroups) {
    super(api)
    this.workerId = workerId
    this.module = module
  }

  public async execute(): Promise<void> {
    const lead = await this.api.getGroupLead(this.module)
    if (!lead) {
      throw new Error('No Lead')
    }
    const leadAccount = lead.role_account_id.toString()

    // Fee estimation and transfer
    const slashStakeFee: BN = this.api.estimateSlashStakeFee(this.module)
    this.api.treasuryTransferBalance(leadAccount, slashStakeFee)
    const slashAmount: BN = new BN(1)

    // Slash worker
    const slashedStake: BN = (await this.api.getWorkerStakeAmount(this.workerId, this.module)).sub(slashAmount)
    await this.api.slashStake(leadAccount, this.workerId, slashAmount, this.module)
    const newStake: BN = await this.api.getWorkerStakeAmount(this.workerId, this.module)

    // Assertions
    assert(slashedStake.eq(newStake), `Unexpected worker stake ${newStake}, expected ${slashedStake}`)
  }
}

export class TerminateRoleFixture extends BaseFixture {
  private workerId: WorkerId
  private module: WorkingGroups

  constructor(api: Api, workerId: WorkerId, module: WorkingGroups) {
    super(api)
    this.workerId = workerId
    this.module = module
  }

  public async execute(): Promise<void> {
    const lead = await this.api.getGroupLead(this.module)
    if (!lead) {
      throw new Error('No Lead')
    }
    const leadAccount = lead.role_account_id.toString()

    // Fee estimation and transfer
    const terminateRoleFee: BN = this.api.estimateTerminateRoleFee(this.module)
    this.api.treasuryTransferBalance(leadAccount, terminateRoleFee)

    // Terminate worker role
    await this.api.terminateRole(leadAccount, this.workerId, uuid().substring(0, 8), this.module)

    // Assertions
    const isWorker: boolean = await this.api.isWorker(this.workerId, this.module)
    assert(!isWorker, `Worker ${this.workerId} is not terminated`)
  }
}

export class LeaveRoleFixture extends BaseFixture {
  private workerIds: WorkerId[]
  private module: WorkingGroups

  constructor(api: Api, workerIds: WorkerId[], module: WorkingGroups) {
    super(api)
    this.workerIds = workerIds
    this.module = module
  }

  public async execute(): Promise<void> {
    const roleAccounts = await this.api.getWorkerRoleAccounts(this.workerIds, this.module)
    // Fee estimation and transfer
    const leaveRoleFee: BN = this.api.estimateLeaveRoleFee(this.module)
    this.api.treasuryTransferBalanceToAccounts(roleAccounts, leaveRoleFee)

    await this.api.batchLeaveRole(this.workerIds, uuid().substring(0, 8), this.module)

    // Assertions
    this.workerIds.forEach(async (workerId) => {
      const isWorker: boolean = await this.api.isWorker(workerId, this.module)
      assert(!isWorker, `Worker${workerId} is not terminated`)
    })
  }
}

export class AwaitPayoutFixture extends BaseFixture {
  private workerId: WorkerId
  private module: WorkingGroups

  constructor(api: Api, workerId: WorkerId, module: WorkingGroups) {
    super(api)
    this.workerId = workerId
    this.module = module
  }

  public async execute(): Promise<void> {
    const worker: Worker = await this.api.getWorkerById(this.workerId, this.module)
    const reward: RewardRelationship = await this.api.getRewardRelationship(worker.reward_relationship.unwrap())
    const now: BN = await this.api.getBestBlock()
    const nextPaymentBlock: BN = new BN(reward.getField('next_payment_at_block').toString())
    const payoutInterval: BN = new BN(reward.getField('payout_interval').toString())
    const amountPerPayout: BN = new BN(reward.getField('amount_per_payout').toString())

    assert(now.lt(nextPaymentBlock), `Payout already happened in block ${nextPaymentBlock} now ${now}`)
    const balance: BN = await this.api.getBalance(reward.account.toString())

    const firstPayoutWaitingPeriod: BN = nextPaymentBlock.sub(now).addn(1)
    await Utils.wait(this.api.getBlockDuration().mul(firstPayoutWaitingPeriod).toNumber())

    const balanceAfterFirstPayout: BN = await this.api.getBalance(reward.account.toString())
    const expectedBalanceFirst: BN = balance.add(amountPerPayout)
    assert(
      balanceAfterFirstPayout.eq(expectedBalanceFirst),
      `Unexpected balance, expected ${expectedBalanceFirst} got ${balanceAfterFirstPayout}`
    )

    const secondPayoutWaitingPeriod: BN = payoutInterval.addn(1)
    await Utils.wait(this.api.getBlockDuration().mul(secondPayoutWaitingPeriod).toNumber())

    const balanceAfterSecondPayout: BN = await this.api.getBalance(reward.account.toString())
    const expectedBalanceSecond: BN = expectedBalanceFirst.add(amountPerPayout)
    assert(
      balanceAfterSecondPayout.eq(expectedBalanceSecond),
      `Unexpected balance, expected ${expectedBalanceSecond} got ${balanceAfterSecondPayout}`
    )
  }
}

type HireWorkesConfig = {
  applicationStake: BN
  roleStake: BN
  firstRewardInterval: BN
  rewardInterval: BN
  payoutAmount: BN
  unstakingPeriod: BN
  openingActivationDelay: BN
}

export class HireWorkesFixture extends BaseFixture {
  private numberOfWorkers: number
  private config: HireWorkesConfig
  private module: WorkingGroups
  private workerIds: WorkerId[] = []

  constructor(api: Api, numberOfWorkers: number, module: WorkingGroups, config?: Partial<HireWorkesConfig>) {
    super(api)
    this.numberOfWorkers = numberOfWorkers
    this.module = module
    this.config = {
      applicationStake: config?.applicationStake || new BN(process.env.WORKING_GROUP_APPLICATION_STAKE!),
      roleStake: config?.roleStake || new BN(process.env.WORKING_GROUP_ROLE_STAKE!),
      firstRewardInterval: config?.firstRewardInterval || new BN(process.env.SHORT_FIRST_REWARD_INTERVAL!),
      rewardInterval: config?.rewardInterval || new BN(process.env.SHORT_REWARD_INTERVAL!),
      payoutAmount: config?.payoutAmount || new BN(process.env.PAYOUT_AMOUNT!),
      unstakingPeriod: config?.unstakingPeriod || new BN(process.env.STORAGE_WORKING_GROUP_UNSTAKING_PERIOD!),
      openingActivationDelay: config?.openingActivationDelay || new BN(0),
    }
  }

  public getHiredWorkers(): WorkerId[] {
    if (!this.executed) {
      throw new Error('Fixture not yet executed!')
    }
    return this.workerIds
  }

  public async execute(): Promise<void> {
    const { api, module } = this
    const {
      applicationStake,
      roleStake,
      openingActivationDelay,
      unstakingPeriod,
      firstRewardInterval,
      rewardInterval,
      payoutAmount,
    } = this.config

    const lead = await api.getGroupLead(module)
    assert(lead)

    const paidTemrsId = api.createPaidTermId(new BN(process.env.MEMBERSHIP_PAID_TERMS!))
    const newMembers = api.createKeyPairs(this.numberOfWorkers).map((key) => key.address)

    const memberSetFixture = new BuyMembershipHappyCaseFixture(api, newMembers, paidTemrsId)
    // Recreating set of members
    await new FixtureRunner(memberSetFixture).run()
    const applicants = newMembers

    const addWorkerOpeningFixture = new AddWorkerOpeningFixture(
      api,
      applicationStake,
      roleStake,
      openingActivationDelay,
      unstakingPeriod,
      module
    )
    // Add worker opening
    await new FixtureRunner(addWorkerOpeningFixture).run()

    // First apply for worker opening
    const applyForWorkerOpeningFixture = new ApplyForOpeningFixture(
      api,
      applicants,
      applicationStake,
      roleStake,
      addWorkerOpeningFixture.getCreatedOpeningId() as OpeningId,
      module
    )
    await new FixtureRunner(applyForWorkerOpeningFixture).run()
    const applicationIds = applyForWorkerOpeningFixture.getApplicationIds()

    // Begin application review
    const beginApplicationReviewFixture = new BeginApplicationReviewFixture(
      api,
      addWorkerOpeningFixture.getCreatedOpeningId() as OpeningId,
      module
    )
    await new FixtureRunner(beginApplicationReviewFixture).run()

    // Fill worker opening
    const fillOpeningFixture = new FillOpeningFixture(
      api,
      applicationIds,
      addWorkerOpeningFixture.getCreatedOpeningId() as OpeningId,
      firstRewardInterval,
      rewardInterval,
      payoutAmount,
      module
    )
    await new FixtureRunner(fillOpeningFixture).run()
    this.workerIds = fillOpeningFixture.getWorkerIds()
  }
}
