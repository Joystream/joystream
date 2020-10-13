import BN from 'bn.js'
import { assert } from 'chai'
import { Api, WorkingGroups } from '../Api'
import { KeyringPair } from '@polkadot/keyring/types'
import { v4 as uuid } from 'uuid'
import { RewardRelationship } from '@joystream/types/recurring-rewards'
import { Application, ApplicationIdToWorkerIdMap, Worker, WorkerId } from '@joystream/types/working-group'
import { Utils } from '../utils'
import { ApplicationId, Opening as HiringOpening, OpeningId } from '@joystream/types/hiring'
import { Fixture } from '../IFixture'

export class AddWorkerOpeningFixture implements Fixture {
  private api: Api
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
    this.api = api
    this.applicationStake = applicationStake
    this.roleStake = roleStake
    this.activationDelay = activationDelay
    this.unstakingPeriod = unstakingPeriod
    this.module = module
  }

  public async runner(expectFailure: boolean): Promise<void> {
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
      this.module,
      expectFailure
    )

    if (!expectFailure) {
      this.result = this.api.expectOpeningAddedEvent(result.events)
    }
  }
}

export class SudoAddLeaderOpeningFixture implements Fixture {
  private api: Api
  private applicationStake: BN
  private roleStake: BN
  private activationDelay: BN
  private module: WorkingGroups

  private result: OpeningId | undefined

  public getCreatedOpeningId(): OpeningId | undefined {
    return this.result
  }

  public constructor(api: Api, applicationStake: BN, roleStake: BN, activationDelay: BN, module: WorkingGroups) {
    this.api = api
    this.applicationStake = applicationStake
    this.roleStake = roleStake
    this.activationDelay = activationDelay
    this.module = module
  }

  public async runner(expectFailure: boolean): Promise<void> {
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

    if (expectFailure) {
      throw new Error('Successful fixture run while expecting failure')
    } else {
      this.result = this.api.expectOpeningAddedEvent(result.events)
    }
  }
}

export class AcceptApplicationsFixture implements Fixture {
  private api: Api
  private openingId: OpeningId
  private module: WorkingGroups

  public constructor(api: Api, openingId: OpeningId, module: WorkingGroups) {
    this.api = api
    this.openingId = openingId
    this.module = module
  }

  public async runner(expectFailure: boolean): Promise<void> {
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
    if (expectFailure) {
      throw new Error('Successful fixture run while expecting failure')
    }
  }
}

export class ApplyForOpeningFixture implements Fixture {
  private api: Api
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
    this.api = api
    this.applicants = applicants
    this.applicationStake = applicationStake
    this.roleStake = roleStake
    this.openingId = openingId
    this.module = module
  }

  public getApplicationIds(): ApplicationId[] {
    return this.result
  }

  public async runner(expectFailure: boolean): Promise<void> {
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
      this.module,
      expectFailure
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

export class WithdrawApplicationFixture implements Fixture {
  private api: Api
  private applicationIds: ApplicationId[]
  private module: WorkingGroups

  constructor(api: Api, applicationIds: ApplicationId[], module: WorkingGroups) {
    this.api = api
    this.applicationIds = applicationIds
    this.module = module
  }

  public async runner(expectFailure: boolean): Promise<void> {
    // Fee estimation and transfer
    const withdrawApplicaitonFee: BN = this.api.estimateWithdrawApplicationFee(this.module)

    // get role accounts of applicants
    const roleAccounts = await this.api.getApplicantRoleAccounts(this.applicationIds, this.module)
    this.api.treasuryTransferBalanceToAccounts(roleAccounts, withdrawApplicaitonFee)

    // Application withdrawal
    await this.api.batchWithdrawActiveApplications(this.applicationIds, this.module)

    if (expectFailure) {
      throw new Error('Successful fixture run while expecting failure')
    }
  }
}

export class BeginApplicationReviewFixture implements Fixture {
  private api: Api
  private openingId: OpeningId
  private module: WorkingGroups

  constructor(api: Api, openingId: OpeningId, module: WorkingGroups) {
    this.api = api
    this.openingId = openingId
    this.module = module
  }

  public async runner(expectFailure: boolean): Promise<void> {
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

    this.api.expectApplicationReviewBeganEvent(result.events)

    if (expectFailure) {
      throw new Error('Successful fixture run while expecting failure')
    }
  }
}

export class SudoBeginLeaderApplicationReviewFixture implements Fixture {
  private api: Api
  private openingId: OpeningId
  private module: WorkingGroups

  constructor(api: Api, openingId: OpeningId, module: WorkingGroups) {
    this.api = api
    this.openingId = openingId
    this.module = module
  }

  public async runner(expectFailure: boolean): Promise<void> {
    // Begin application review
    await this.api.sudoBeginApplicantReview(this.openingId, this.module)
    if (expectFailure) {
      throw new Error('Successful fixture run while expecting failure')
    }
  }
}

export class FillOpeningFixture implements Fixture {
  private api: Api
  private applicationIds: ApplicationId[]
  private openingId: OpeningId
  private firstPayoutInterval: BN
  private payoutInterval: BN
  private amountPerPayout: BN
  private module: WorkingGroups

  constructor(
    api: Api,
    applicationIds: ApplicationId[],
    openingId: OpeningId,
    firstPayoutInterval: BN,
    payoutInterval: BN,
    amountPerPayout: BN,
    module: WorkingGroups
  ) {
    this.api = api
    this.applicationIds = applicationIds
    this.openingId = openingId
    this.firstPayoutInterval = firstPayoutInterval
    this.payoutInterval = payoutInterval
    this.amountPerPayout = amountPerPayout
    this.module = module
  }

  public async runner(expectFailure: boolean): Promise<void> {
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
    const applicationIdToWorkerIdMap: ApplicationIdToWorkerIdMap = this.api.expectOpeningFilledEvent(result.events)

    // Assertions
    applicationIdToWorkerIdMap.forEach(async (workerId, applicationId) => {
      const worker: Worker = await this.api.getWorkerById(workerId, this.module)
      const application: Application = await this.api.getApplicationById(applicationId, this.module)
      assert(
        worker.role_account_id.toString() === application.role_account_id.toString(),
        `Role account ids does not match, worker account: ${worker.role_account_id}, application account ${application.role_account_id}`
      )
    })

    if (expectFailure) {
      throw new Error('Successful fixture run while expecting failure')
    }
  }
}

export class SudoFillLeaderOpeningFixture implements Fixture {
  private api: Api
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
    this.api = api
    this.applicationId = applicationId
    this.openingId = openingId
    this.firstPayoutInterval = firstPayoutInterval
    this.payoutInterval = payoutInterval
    this.amountPerPayout = amountPerPayout
    this.module = module
  }

  public async runner(expectFailure: boolean): Promise<void> {
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
    const applicationIdToWorkerIdMap = this.api.expectOpeningFilledEvent(result.events)
    assert(applicationIdToWorkerIdMap.size === 1)
    applicationIdToWorkerIdMap.forEach(async (workerId, applicationId) => {
      const worker: Worker = await this.api.getWorkerById(workerId, this.module)
      const application: Application = await this.api.getApplicationById(applicationId, this.module)
      const leadWorkerId: WorkerId = (await this.api.getLeadWorkerId(this.module))!
      assert(
        worker.role_account_id.toString() === application.role_account_id.toString(),
        `Role account ids does not match, leader account: ${worker.role_account_id}, application account ${application.role_account_id}`
      )
      assert(
        leadWorkerId.eq(workerId),
        `Role account ids does not match, leader account: ${worker.role_account_id}, application account ${application.role_account_id}`
      )
    })

    if (expectFailure) {
      throw new Error('Successful fixture run while expecting failure')
    }
  }
}

export class IncreaseStakeFixture implements Fixture {
  private api: Api
  private workerId: WorkerId
  private module: WorkingGroups

  constructor(api: Api, workerId: WorkerId, module: WorkingGroups) {
    this.api = api
    this.workerId = workerId
    this.module = module
  }

  public async runner(expectFailure: boolean): Promise<void> {
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
    if (expectFailure) {
      throw new Error('Successful fixture run while expecting failure')
    }
  }
}

export class UpdateRewardAccountFixture implements Fixture {
  public api: Api
  public workerId: WorkerId
  public module: WorkingGroups

  constructor(api: Api, workerId: WorkerId, module: WorkingGroups) {
    this.api = api
    this.workerId = workerId
    this.module = module
  }

  public async runner(expectFailure: boolean): Promise<void> {
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
    if (expectFailure) {
      throw new Error('Successful fixture run while expecting failure')
    }
  }
}

export class UpdateRoleAccountFixture implements Fixture {
  private api: Api
  private workerId: WorkerId
  private module: WorkingGroups

  constructor(api: Api, workerId: WorkerId, module: WorkingGroups) {
    this.api = api
    this.workerId = workerId
    this.module = module
  }

  public async runner(expectFailure: boolean): Promise<void> {
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

    if (expectFailure) {
      throw new Error('Successful fixture run while expecting failure')
    }
  }
}

export class TerminateApplicationsFixture implements Fixture {
  private api: Api
  private applicationIds: ApplicationId[]
  private module: WorkingGroups

  constructor(api: Api, applicationIds: ApplicationId[], module: WorkingGroups) {
    this.api = api
    this.applicationIds = applicationIds
    this.module = module
  }

  public async runner(expectFailure: boolean): Promise<void> {
    const lead = await this.api.getGroupLead(this.module)
    if (!lead) {
      throw new Error('No Lead')
    }
    const leadAccount = lead.role_account_id.toString()

    // Fee estimation and transfer
    const terminateApplicationFee: BN = this.api.estimateTerminateApplicationFee(this.module)
    this.api.treasuryTransferBalance(leadAccount, terminateApplicationFee.muln(this.applicationIds.length))

    // Terminate worker applications
    await this.api.batchTerminateApplication(leadAccount, this.applicationIds, this.module)

    if (expectFailure) {
      throw new Error('Successful fixture run while expecting failure')
    }
  }
}

export class DecreaseStakeFixture implements Fixture {
  private api: Api
  private workerId: WorkerId
  private module: WorkingGroups

  constructor(api: Api, workerId: WorkerId, module: WorkingGroups) {
    this.api = api
    this.workerId = workerId
    this.module = module
  }

  public async runner(expectFailure: boolean): Promise<void> {
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
    await this.api.decreaseStake(leadAccount, this.workerId, workerStakeDecrement, this.module, expectFailure)
    const newWorkerStake: BN = await this.api.getWorkerStakeAmount(this.workerId, this.module)

    // Assertions
    if (!expectFailure) {
      assert(
        decreasedWorkerStake.eq(newWorkerStake),
        `Unexpected worker stake ${newWorkerStake}, expected ${decreasedWorkerStake}`
      )
    }
  }
}

export class SlashFixture implements Fixture {
  private api: Api
  private workerId: WorkerId
  private module: WorkingGroups

  constructor(api: Api, workerId: WorkerId, module: WorkingGroups) {
    this.api = api
    this.workerId = workerId
    this.module = module
  }

  public async runner(expectFailure: boolean): Promise<void> {
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
    await this.api.slashStake(leadAccount, this.workerId, slashAmount, this.module, expectFailure)
    const newStake: BN = await this.api.getWorkerStakeAmount(this.workerId, this.module)

    // Assertions
    assert(slashedStake.eq(newStake), `Unexpected worker stake ${newStake}, expected ${slashedStake}`)
  }
}

export class TerminateRoleFixture implements Fixture {
  private api: Api
  private workerId: WorkerId
  private module: WorkingGroups

  constructor(api: Api, workerId: WorkerId, module: WorkingGroups) {
    this.api = api
    this.workerId = workerId
    this.module = module
  }

  public async runner(expectFailure: boolean): Promise<void> {
    const lead = await this.api.getGroupLead(this.module)
    if (!lead) {
      throw new Error('No Lead')
    }
    const leadAccount = lead.role_account_id.toString()

    // Fee estimation and transfer
    const terminateRoleFee: BN = this.api.estimateTerminateRoleFee(this.module)
    this.api.treasuryTransferBalance(leadAccount, terminateRoleFee)

    // Terminate worker role
    await this.api.terminateRole(leadAccount, this.workerId, uuid().substring(0, 8), this.module, expectFailure)

    // Assertions
    const isWorker: boolean = await this.api.isWorker(this.workerId, this.module)
    assert(!isWorker, `Worker ${this.workerId} is not terminated`)
  }
}

export class LeaveRoleFixture implements Fixture {
  private api: Api
  private workerIds: WorkerId[]
  private module: WorkingGroups

  constructor(api: Api, workerIds: WorkerId[], module: WorkingGroups) {
    this.api = api
    this.workerIds = workerIds
    this.module = module
  }

  public async runner(expectFailure: boolean): Promise<void> {
    const roleAccounts = await this.api.getWorkerRoleAccounts(this.workerIds, this.module)
    // Fee estimation and transfer
    const leaveRoleFee: BN = this.api.estimateLeaveRoleFee(this.module)
    this.api.treasuryTransferBalanceToAccounts(roleAccounts, leaveRoleFee)

    await this.api.batchLeaveRole(this.workerIds, uuid().substring(0, 8), expectFailure, this.module)

    // Assertions
    this.workerIds.forEach(async (workerId) => {
      const isWorker: boolean = await this.api.isWorker(workerId, this.module)
      assert(!isWorker, `Worker${workerId} is not terminated`)
    })
  }
}

export class AwaitPayoutFixture implements Fixture {
  private api: Api
  private workerId: WorkerId
  private module: WorkingGroups

  constructor(api: Api, workerId: WorkerId, module: WorkingGroups) {
    this.api = api
    this.workerId = workerId
    this.module = module
  }

  public async runner(expectFailure: boolean): Promise<void> {
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
    if (expectFailure) {
      throw new Error('Successful fixture run while expecting failure')
    }
  }
}
