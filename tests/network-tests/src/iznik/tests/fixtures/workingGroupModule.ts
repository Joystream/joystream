import BN from 'bn.js'
import { assert } from 'chai'
import { ApiWrapper, WorkingGroups } from '../../utils/apiWrapper'
import { KeyringPair } from '@polkadot/keyring/types'
import { Event } from '@polkadot/types/interfaces'
import { Keyring } from '@polkadot/api'
import { v4 as uuid } from 'uuid'
import { RewardRelationship } from '@alexandria/types/recurring-rewards'
import { Application, ApplicationIdToWorkerIdMap, Worker, WorkerId } from '@alexandria/types/working-group'
import { Utils } from '../../utils/utils'
import { ApplicationId, Opening as HiringOpening, OpeningId } from '@alexandria/types/hiring'
import { Fixture } from './interfaces/fixture'

export class AddWorkerOpeningFixture implements Fixture {
  private apiWrapper: ApiWrapper
  private membersKeyPairs: KeyringPair[]
  private lead: KeyringPair
  private treasury: KeyringPair
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
    apiWrapper: ApiWrapper,
    membersKeyPairs: KeyringPair[],
    lead: KeyringPair,
    treasury: KeyringPair,
    applicationStake: BN,
    roleStake: BN,
    activationDelay: BN,
    unstakingPeriod: BN,
    module: WorkingGroups
  ) {
    this.apiWrapper = apiWrapper
    this.membersKeyPairs = membersKeyPairs
    this.lead = lead
    this.treasury = treasury
    this.applicationStake = applicationStake
    this.roleStake = roleStake
    this.activationDelay = activationDelay
    this.unstakingPeriod = unstakingPeriod
    this.module = module
  }

  public async runner(expectFailure: boolean): Promise<void> {
    // Fee estimation and transfer
    const addOpeningFee: BN = this.apiWrapper.estimateAddOpeningFee(this.module)
    await this.apiWrapper.transferBalance(this.treasury, this.lead.address, addOpeningFee)

    // Worker opening creation
    const addOpeningPromise: Promise<Event> = this.apiWrapper.expectEvent('OpeningAdded')
    await this.apiWrapper.addOpening({
      leader: this.lead,
      activationDelay: this.activationDelay,
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
      fillOpeningSuccessfulApplicantApplicationStakeUnstakingPeriod: this.unstakingPeriod,
      fillOpeningFailedApplicantApplicationStakeUnstakingPeriod: this.unstakingPeriod,
      fillOpeningFailedApplicantRoleStakeUnstakingPeriod: this.unstakingPeriod,
      terminateApplicationStakeUnstakingPeriod: this.unstakingPeriod,
      terminateRoleStakeUnstakingPeriod: this.unstakingPeriod,
      exitRoleApplicationStakeUnstakingPeriod: this.unstakingPeriod,
      exitRoleStakeUnstakingPeriod: this.unstakingPeriod,
      text: uuid().substring(0, 8),
      type: 'Worker',
      module: this.module,
      expectFailure: expectFailure,
    })
    if (!expectFailure) {
      const openingId: OpeningId = (await addOpeningPromise).data[0] as OpeningId
      this.result = openingId
    }
  }
}

export class AddLeaderOpeningFixture implements Fixture {
  private apiWrapper: ApiWrapper
  private membersKeyPairs: KeyringPair[]
  private sudo: KeyringPair
  private applicationStake: BN
  private roleStake: BN
  private activationDelay: BN
  private module: WorkingGroups

  private result: OpeningId | undefined

  public getCreatedOpeningId(): OpeningId | undefined {
    return this.result
  }

  public constructor(
    apiWrapper: ApiWrapper,
    membersKeyPairs: KeyringPair[],
    sudo: KeyringPair,
    applicationStake: BN,
    roleStake: BN,
    activationDelay: BN,
    module: WorkingGroups
  ) {
    this.apiWrapper = apiWrapper
    this.membersKeyPairs = membersKeyPairs
    this.sudo = sudo
    this.applicationStake = applicationStake
    this.roleStake = roleStake
    this.activationDelay = activationDelay
    this.module = module
  }

  public async runner(expectFailure: boolean): Promise<void> {
    const addOpeningPromise: Promise<Event> = this.apiWrapper.expectEvent('OpeningAdded')
    await this.apiWrapper.sudoAddOpening({
      sudo: this.sudo,
      activationDelay: this.activationDelay,
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
      type: 'Leader',
      module: this.module,
    })
    this.result = (await addOpeningPromise).data[0] as OpeningId
    if (expectFailure) {
      throw new Error('Successful fixture run while expecting failure')
    }
  }
}

export class AcceptApplicationsFixture implements Fixture {
  private apiWrapper: ApiWrapper
  private lead: KeyringPair
  private treasury: KeyringPair
  private openingId: OpeningId
  private module: WorkingGroups

  public constructor(
    apiWrapper: ApiWrapper,
    lead: KeyringPair,
    treasury: KeyringPair,
    openingId: OpeningId,
    module: WorkingGroups
  ) {
    this.apiWrapper = apiWrapper
    this.lead = lead
    this.treasury = treasury
    this.openingId = openingId
    this.module = module
  }

  public async runner(expectFailure: boolean): Promise<void> {
    // Fee estimation and transfer
    const acceptApplicationsFee: BN = this.apiWrapper.estimateAcceptApplicationsFee(this.module)
    await this.apiWrapper.transferBalance(this.treasury, this.lead.address, acceptApplicationsFee)

    // Begin accepting applications
    await this.apiWrapper.acceptApplications(this.lead, this.openingId, this.module)

    const opening: HiringOpening = await this.apiWrapper.getHiringOpening(this.openingId)
    assert(opening.is_active, `Opening ${this.openingId} is not active`)
    if (expectFailure) {
      throw new Error('Successful fixture run while expecting failure')
    }
  }
}

export class ApplyForOpeningFixture implements Fixture {
  private apiWrapper: ApiWrapper
  private membersKeyPairs: KeyringPair[]
  private treasury: KeyringPair
  private applicationStake: BN
  private roleStake: BN
  private openingId: OpeningId
  private module: WorkingGroups

  public constructor(
    apiWrapper: ApiWrapper,
    membersKeyPairs: KeyringPair[],
    treasury: KeyringPair,
    applicationStake: BN,
    roleStake: BN,
    openingId: OpeningId,
    module: WorkingGroups
  ) {
    this.apiWrapper = apiWrapper
    this.membersKeyPairs = membersKeyPairs
    this.treasury = treasury
    this.applicationStake = applicationStake
    this.roleStake = roleStake
    this.openingId = openingId
    this.module = module
  }

  public async runner(expectFailure: boolean): Promise<void> {
    // Fee estimation and transfer
    const applyOnOpeningFee: BN = this.apiWrapper
      .estimateApplyOnOpeningFee(this.treasury, this.module)
      .add(this.applicationStake)
      .add(this.roleStake)
    await this.apiWrapper.transferBalanceToAccounts(this.treasury, this.membersKeyPairs, applyOnOpeningFee)

    // Applying for created worker opening
    await this.apiWrapper.batchApplyOnOpening(
      this.membersKeyPairs,
      this.openingId,
      this.roleStake,
      this.applicationStake,
      uuid().substring(0, 8),
      this.module,
      expectFailure
    )
  }
}

export class WithdrawApplicationFixture implements Fixture {
  private apiWrapper: ApiWrapper
  private membersKeyPairs: KeyringPair[]
  private treasury: KeyringPair
  private module: WorkingGroups

  constructor(apiWrapper: ApiWrapper, membersKeyPairs: KeyringPair[], treasury: KeyringPair, module: WorkingGroups) {
    this.apiWrapper = apiWrapper
    this.membersKeyPairs = membersKeyPairs
    this.treasury = treasury
    this.module = module
  }

  public async runner(expectFailure: boolean): Promise<void> {
    // Fee estimation and transfer
    const withdrawApplicaitonFee: BN = this.apiWrapper.estimateWithdrawApplicationFee(this.module)
    await this.apiWrapper.transferBalanceToAccounts(this.treasury, this.membersKeyPairs, withdrawApplicaitonFee)

    // Application withdrawal
    await this.apiWrapper.batchWithdrawApplication(this.membersKeyPairs, this.module)

    // Assertions
    this.membersKeyPairs.forEach(async (keyPair) => {
      const activeApplications: ApplicationId[] = await this.apiWrapper.getActiveApplicationsIdsByRoleAccount(
        keyPair.address,
        this.module
      )
      assert(activeApplications.length === 0, `Unexpected active application found for ${keyPair.address}`)
    })
    if (expectFailure) {
      throw new Error('Successful fixture run while expecting failure')
    }
  }
}

export class BeginApplicationReviewFixture implements Fixture {
  private apiWrapper: ApiWrapper
  private lead: KeyringPair
  private treasury: KeyringPair
  private openingId: OpeningId
  private module: WorkingGroups

  constructor(
    apiWrapper: ApiWrapper,
    lead: KeyringPair,
    treasury: KeyringPair,
    openingId: OpeningId,
    module: WorkingGroups
  ) {
    this.apiWrapper = apiWrapper
    this.lead = lead
    this.treasury = treasury
    this.openingId = openingId
    this.module = module
  }

  public async runner(expectFailure: boolean): Promise<void> {
    // Fee estimation and transfer
    const beginReviewFee: BN = this.apiWrapper.estimateBeginApplicantReviewFee(this.module)
    await this.apiWrapper.transferBalance(this.treasury, this.lead.address, beginReviewFee)

    // Begin application review
    const beginApplicantReviewPromise: Promise<ApplicationId> = this.apiWrapper.expectApplicationReviewBegan()
    await this.apiWrapper.beginApplicantReview(this.lead, this.openingId, this.module)
    await beginApplicantReviewPromise
    if (expectFailure) {
      throw new Error('Successful fixture run while expecting failure')
    }
  }
}

export class BeginLeaderApplicationReviewFixture implements Fixture {
  private apiWrapper: ApiWrapper
  private sudo: KeyringPair
  private openingId: OpeningId
  private module: WorkingGroups

  constructor(apiWrapper: ApiWrapper, sudo: KeyringPair, openingId: OpeningId, module: WorkingGroups) {
    this.apiWrapper = apiWrapper
    this.sudo = sudo
    this.openingId = openingId
    this.module = module
  }

  public async runner(expectFailure: boolean): Promise<void> {
    // Begin application review
    await this.apiWrapper.sudoBeginApplicantReview(this.sudo, this.openingId, this.module)
    if (expectFailure) {
      throw new Error('Successful fixture run while expecting failure')
    }
  }
}

export class FillOpeningFixture implements Fixture {
  private apiWrapper: ApiWrapper
  private membersKeyPairs: KeyringPair[]
  private lead: KeyringPair
  private treasury: KeyringPair
  private openingId: OpeningId
  private firstPayoutInterval: BN
  private payoutInterval: BN
  private amountPerPayout: BN
  private module: WorkingGroups

  constructor(
    apiWrapper: ApiWrapper,
    membersKeyPairs: KeyringPair[],
    lead: KeyringPair,
    treasury: KeyringPair,
    openingId: OpeningId,
    firstPayoutInterval: BN,
    payoutInterval: BN,
    amountPerPayout: BN,
    module: WorkingGroups
  ) {
    this.apiWrapper = apiWrapper
    this.membersKeyPairs = membersKeyPairs
    this.lead = lead
    this.treasury = treasury
    this.openingId = openingId
    this.firstPayoutInterval = firstPayoutInterval
    this.payoutInterval = payoutInterval
    this.amountPerPayout = amountPerPayout
    this.module = module
  }

  public async runner(expectFailure: boolean): Promise<void> {
    // Fee estimation and transfer
    const beginReviewFee: BN = this.apiWrapper.estimateFillOpeningFee(this.module)
    await this.apiWrapper.transferBalance(this.treasury, this.lead.address, beginReviewFee)
    const applicationIds: ApplicationId[] = (
      await Promise.all(
        this.membersKeyPairs.map(async (keypair) =>
          this.apiWrapper.getActiveApplicationsIdsByRoleAccount(keypair.address, this.module)
        )
      )
    ).flat()

    // Fill worker opening
    const now: BN = await this.apiWrapper.getBestBlock()
    const fillOpeningPromise: Promise<ApplicationIdToWorkerIdMap> = this.apiWrapper.expectOpeningFilled()
    await this.apiWrapper.fillOpening(
      this.lead,
      this.openingId,
      applicationIds,
      this.amountPerPayout,
      now.add(this.firstPayoutInterval),
      this.payoutInterval,
      this.module
    )
    const applicationIdToWorkerIdMap: ApplicationIdToWorkerIdMap = await fillOpeningPromise

    // Assertions
    applicationIdToWorkerIdMap.forEach(async (workerId, applicationId) => {
      const worker: Worker = await this.apiWrapper.getWorkerById(workerId, this.module)
      const application: Application = await this.apiWrapper.getApplicationById(applicationId, this.module)
      assert(
        worker.role_account_id.toString() === application.role_account_id.toString(),
        `Role account ids does not match, worker account: ${worker.role_account_id}, application account ${application.role_account_id}`
      )
    })
    const openingWorkersAccounts: string[] = (await this.apiWrapper.getWorkers(this.module)).map((worker) =>
      worker.role_account_id.toString()
    )
    this.membersKeyPairs.forEach((keyPair) =>
      assert(openingWorkersAccounts.includes(keyPair.address), `Account ${keyPair.address} is not worker`)
    )
    if (expectFailure) {
      throw new Error('Successful fixture run while expecting failure')
    }
  }
}

export class FillLeaderOpeningFixture implements Fixture {
  private apiWrapper: ApiWrapper
  private membersKeyPairs: KeyringPair[]
  private sudo: KeyringPair
  private openingId: OpeningId
  private firstPayoutInterval: BN
  private payoutInterval: BN
  private amountPerPayout: BN
  private module: WorkingGroups

  constructor(
    apiWrapper: ApiWrapper,
    membersKeyPairs: KeyringPair[],
    sudo: KeyringPair,
    openingId: OpeningId,
    firstPayoutInterval: BN,
    payoutInterval: BN,
    amountPerPayout: BN,
    module: WorkingGroups
  ) {
    this.apiWrapper = apiWrapper
    this.membersKeyPairs = membersKeyPairs
    this.sudo = sudo
    this.openingId = openingId
    this.firstPayoutInterval = firstPayoutInterval
    this.payoutInterval = payoutInterval
    this.amountPerPayout = amountPerPayout
    this.module = module
  }

  public async runner(expectFailure: boolean): Promise<void> {
    const applicationIds: ApplicationId[] = (
      await Promise.all(
        this.membersKeyPairs.map(async (keypair) =>
          this.apiWrapper.getActiveApplicationsIdsByRoleAccount(keypair.address, this.module)
        )
      )
    ).flat()

    // Fill leader opening
    const now: BN = await this.apiWrapper.getBestBlock()
    const fillOpeningPromise: Promise<ApplicationIdToWorkerIdMap> = this.apiWrapper.expectOpeningFilled()
    await this.apiWrapper.sudoFillOpening(
      this.sudo,
      this.openingId,
      applicationIds,
      this.amountPerPayout,
      now.add(this.firstPayoutInterval),
      this.payoutInterval,
      this.module
    )

    // Assertions
    const applicationIdToWorkerIdMap: ApplicationIdToWorkerIdMap = await fillOpeningPromise
    applicationIdToWorkerIdMap.forEach(async (workerId, applicationId) => {
      const worker: Worker = await this.apiWrapper.getWorkerById(workerId, this.module)
      const application: Application = await this.apiWrapper.getApplicationById(applicationId, this.module)
      assert(
        worker.role_account_id.toString() === application.role_account_id.toString(),
        `Role account ids does not match, leader account: ${worker.role_account_id}, application account ${application.role_account_id}`
      )
    })
    const leadWorkerId: WorkerId = (await this.apiWrapper.getLeadWorkerId(this.module))!
    const openingLeaderAccount: string = (
      await this.apiWrapper.getWorkerById(leadWorkerId, this.module)
    ).role_account_id.toString()
    assert(
      openingLeaderAccount === this.membersKeyPairs[0].address,
      `Unexpected leader account ${openingLeaderAccount}, expected ${this.membersKeyPairs[0].address}`
    )
    if (expectFailure) {
      throw new Error('Successful fixture run while expecting failure')
    }
  }
}

export class IncreaseStakeFixture implements Fixture {
  private apiWrapper: ApiWrapper
  private membersKeyPairs: KeyringPair[]
  private treasury: KeyringPair
  private module: WorkingGroups

  constructor(apiWrapper: ApiWrapper, membersKeyPairs: KeyringPair[], treasury: KeyringPair, module: WorkingGroups) {
    this.apiWrapper = apiWrapper
    this.membersKeyPairs = membersKeyPairs
    this.treasury = treasury
    this.module = module
  }

  public async runner(expectFailure: boolean): Promise<void> {
    // Fee estimation and transfer
    const increaseStakeFee: BN = this.apiWrapper.estimateIncreaseStakeFee(this.module)
    const stakeIncrement: BN = new BN(1)
    await this.apiWrapper.transferBalance(
      this.treasury,
      this.membersKeyPairs[0].address,
      increaseStakeFee.add(stakeIncrement)
    )
    const workerId: WorkerId = await this.apiWrapper.getWorkerIdByRoleAccount(
      this.membersKeyPairs[0].address,
      this.module
    )

    // Increase worker stake
    const increasedWorkerStake: BN = (await this.apiWrapper.getWorkerStakeAmount(workerId, this.module)).add(
      stakeIncrement
    )
    await this.apiWrapper.increaseStake(this.membersKeyPairs[0], workerId, stakeIncrement, this.module)
    const newWorkerStake: BN = await this.apiWrapper.getWorkerStakeAmount(workerId, this.module)
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
  public apiWrapper: ApiWrapper
  public membersKeyPairs: KeyringPair[]
  public keyring: Keyring
  public treasury: KeyringPair
  public module: WorkingGroups

  constructor(
    apiWrapper: ApiWrapper,
    membersKeyPairs: KeyringPair[],
    keyring: Keyring,
    treasury: KeyringPair,
    module: WorkingGroups
  ) {
    this.apiWrapper = apiWrapper
    this.membersKeyPairs = membersKeyPairs
    this.keyring = keyring
    this.treasury = treasury
    this.module = module
  }

  public async runner(expectFailure: boolean): Promise<void> {
    // Fee estimation and transfer
    const updateRewardAccountFee: BN = this.apiWrapper.estimateUpdateRewardAccountFee(
      this.treasury.address,
      this.module
    )
    await this.apiWrapper.transferBalance(this.treasury, this.membersKeyPairs[0].address, updateRewardAccountFee)
    const workerId: WorkerId = await this.apiWrapper.getWorkerIdByRoleAccount(
      this.membersKeyPairs[0].address,
      this.module
    )

    // Update reward account
    const createdAccount: KeyringPair = this.keyring.addFromUri(uuid().substring(0, 8))
    await this.apiWrapper.updateRewardAccount(this.membersKeyPairs[0], workerId, createdAccount.address, this.module)
    const newRewardAccount: string = await this.apiWrapper.getWorkerRewardAccount(workerId, this.module)
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
  private apiWrapper: ApiWrapper
  private membersKeyPairs: KeyringPair[]
  private keyring: Keyring
  private treasury: KeyringPair
  private module: WorkingGroups

  constructor(
    apiWrapper: ApiWrapper,
    membersKeyPairs: KeyringPair[],
    keyring: Keyring,
    treasury: KeyringPair,
    module: WorkingGroups
  ) {
    this.apiWrapper = apiWrapper
    this.membersKeyPairs = membersKeyPairs
    this.keyring = keyring
    this.treasury = treasury
    this.module = module
  }

  public async runner(expectFailure: boolean): Promise<void> {
    // Fee estimation and transfer
    const updateRoleAccountFee: BN = this.apiWrapper.estimateUpdateRoleAccountFee(this.treasury.address, this.module)
    await this.apiWrapper.transferBalance(this.treasury, this.membersKeyPairs[0].address, updateRoleAccountFee)
    const workerId: WorkerId = await this.apiWrapper.getWorkerIdByRoleAccount(
      this.membersKeyPairs[0].address,
      this.module
    )

    // Update role account
    const createdAccount: KeyringPair = this.keyring.addFromUri(uuid().substring(0, 8))
    await this.apiWrapper.updateRoleAccount(this.membersKeyPairs[0], workerId, createdAccount.address, this.module)
    const newRoleAccount: string = (
      await this.apiWrapper.getWorkerById(workerId, this.module)
    ).role_account_id.toString()
    assert(
      newRoleAccount === createdAccount.address,
      `Unexpected role account ${newRoleAccount}, expected ${createdAccount.address}`
    )

    this.membersKeyPairs[0] = createdAccount
    if (expectFailure) {
      throw new Error('Successful fixture run while expecting failure')
    }
  }
}

export class TerminateApplicationsFixture implements Fixture {
  private apiWrapper: ApiWrapper
  private membersKeyPairs: KeyringPair[]
  private lead: KeyringPair
  private treasury: KeyringPair
  private module: WorkingGroups

  constructor(
    apiWrapper: ApiWrapper,
    membersKeyPairs: KeyringPair[],
    lead: KeyringPair,
    treasury: KeyringPair,
    module: WorkingGroups
  ) {
    this.apiWrapper = apiWrapper
    this.membersKeyPairs = membersKeyPairs
    this.lead = lead
    this.treasury = treasury
    this.module = module
  }

  public async runner(expectFailure: boolean): Promise<void> {
    // Fee estimation and transfer
    const terminateApplicationFee: BN = this.apiWrapper.estimateTerminateApplicationFee(this.module)
    await this.apiWrapper.transferBalance(
      this.treasury,
      this.lead.address,
      terminateApplicationFee.muln(this.membersKeyPairs.length)
    )

    // Terminate worker applications
    await this.apiWrapper.batchTerminateApplication(this.lead, this.membersKeyPairs, this.module)
    this.membersKeyPairs.forEach(async (keyPair) => {
      const activeApplications: ApplicationId[] = await this.apiWrapper.getActiveApplicationsIdsByRoleAccount(
        keyPair.address,
        this.module
      )
      assert(activeApplications.length === 0, `Account ${keyPair.address} has unexpected active applications`)
    })
    if (expectFailure) {
      throw new Error('Successful fixture run while expecting failure')
    }
  }
}

export class DecreaseStakeFixture implements Fixture {
  private apiWrapper: ApiWrapper
  private membersKeyPairs: KeyringPair[]
  private lead: KeyringPair
  private treasury: KeyringPair
  private module: WorkingGroups

  constructor(
    apiWrapper: ApiWrapper,
    membersKeyPairs: KeyringPair[],
    lead: KeyringPair,
    treasury: KeyringPair,
    module: WorkingGroups
  ) {
    this.apiWrapper = apiWrapper
    this.membersKeyPairs = membersKeyPairs
    this.lead = lead
    this.treasury = treasury
    this.module = module
  }

  public async runner(expectFailure: boolean): Promise<void> {
    // Fee estimation and transfer
    const decreaseStakeFee: BN = this.apiWrapper.estimateDecreaseStakeFee(this.module)
    await this.apiWrapper.transferBalance(this.treasury, this.lead.address, decreaseStakeFee)
    const workerStakeDecrement: BN = new BN(1)
    const workerId: WorkerId = await this.apiWrapper.getWorkerIdByRoleAccount(
      this.membersKeyPairs[0].address,
      this.module
    )

    // Worker stake decrement
    const decreasedWorkerStake: BN = (await this.apiWrapper.getWorkerStakeAmount(workerId, this.module)).sub(
      workerStakeDecrement
    )
    await this.apiWrapper.decreaseStake(this.lead, workerId, workerStakeDecrement, this.module, expectFailure)
    const newWorkerStake: BN = await this.apiWrapper.getWorkerStakeAmount(workerId, this.module)

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
  private apiWrapper: ApiWrapper
  private membersKeyPairs: KeyringPair[]
  private lead: KeyringPair
  private treasury: KeyringPair
  private module: WorkingGroups

  constructor(
    apiWrapper: ApiWrapper,
    membersKeyPairs: KeyringPair[],
    lead: KeyringPair,
    treasury: KeyringPair,
    module: WorkingGroups
  ) {
    this.apiWrapper = apiWrapper
    this.membersKeyPairs = membersKeyPairs
    this.lead = lead
    this.treasury = treasury
    this.module = module
  }

  public async runner(expectFailure: boolean): Promise<void> {
    // Fee estimation and transfer
    const slashStakeFee: BN = this.apiWrapper.estimateSlashStakeFee(this.module)
    await this.apiWrapper.transferBalance(this.treasury, this.lead.address, slashStakeFee)
    const slashAmount: BN = new BN(1)
    const workerId: WorkerId = await this.apiWrapper.getWorkerIdByRoleAccount(
      this.membersKeyPairs[0].address,
      this.module
    )

    // Slash worker
    const slashedStake: BN = (await this.apiWrapper.getWorkerStakeAmount(workerId, this.module)).sub(slashAmount)
    await this.apiWrapper.slashStake(this.lead, workerId, slashAmount, this.module, expectFailure)
    const newStake: BN = await this.apiWrapper.getWorkerStakeAmount(workerId, this.module)

    // Assertions
    assert(slashedStake.eq(newStake), `Unexpected worker stake ${newStake}, expected ${slashedStake}`)
  }
}

export class TerminateRoleFixture implements Fixture {
  private apiWrapper: ApiWrapper
  private membersKeyPairs: KeyringPair[]
  private lead: KeyringPair
  private treasury: KeyringPair
  private module: WorkingGroups

  constructor(
    apiWrapper: ApiWrapper,
    membersKeyPairs: KeyringPair[],
    lead: KeyringPair,
    treasury: KeyringPair,
    module: WorkingGroups
  ) {
    this.apiWrapper = apiWrapper
    this.membersKeyPairs = membersKeyPairs
    this.lead = lead
    this.treasury = treasury
    this.module = module
  }

  public async runner(expectFailure: boolean): Promise<void> {
    // Fee estimation and transfer
    const terminateRoleFee: BN = this.apiWrapper.estimateTerminateRoleFee(this.module)
    await this.apiWrapper.transferBalance(this.treasury, this.lead.address, terminateRoleFee)
    const workerId: WorkerId = await this.apiWrapper.getWorkerIdByRoleAccount(
      this.membersKeyPairs[0].address,
      this.module
    )

    // Terminate worker role
    await this.apiWrapper.terminateRole(this.lead, workerId, uuid().substring(0, 8), this.module, expectFailure)

    // Assertions
    const isWorker: boolean = await this.apiWrapper.isWorker(this.membersKeyPairs[0].address, this.module)
    assert(!isWorker, `Worker with account ${this.membersKeyPairs[0].address} is not terminated`)
  }
}

export class LeaveRoleFixture implements Fixture {
  private apiWrapper: ApiWrapper
  private membersKeyPairs: KeyringPair[]
  private treasury: KeyringPair
  private module: WorkingGroups

  constructor(apiWrapper: ApiWrapper, membersKeyPairs: KeyringPair[], treasury: KeyringPair, module: WorkingGroups) {
    this.apiWrapper = apiWrapper
    this.membersKeyPairs = membersKeyPairs
    this.treasury = treasury
    this.module = module
  }

  public async runner(expectFailure: boolean): Promise<void> {
    // Fee estimation and transfer
    const leaveRoleFee: BN = this.apiWrapper.estimateLeaveRoleFee(this.module)
    await this.apiWrapper.transferBalanceToAccounts(this.treasury, this.membersKeyPairs, leaveRoleFee)

    await this.apiWrapper.batchLeaveRole(this.membersKeyPairs, uuid().substring(0, 8), expectFailure, this.module)

    // Assertions
    this.membersKeyPairs.forEach(async (keyPair) => {
      const isWorker: boolean = await this.apiWrapper.isWorker(this.membersKeyPairs[0].address, this.module)
      assert(!isWorker, `Worker with account ${keyPair.address} is not terminated`)
    })
  }
}

export class AwaitPayoutFixture implements Fixture {
  private apiWrapper: ApiWrapper
  private membersKeyPairs: KeyringPair[]
  private module: WorkingGroups

  constructor(apiWrapper: ApiWrapper, membersKeyPairs: KeyringPair[], module: WorkingGroups) {
    this.apiWrapper = apiWrapper
    this.membersKeyPairs = membersKeyPairs
    this.module = module
  }

  public async runner(expectFailure: boolean): Promise<void> {
    const workerId: WorkerId = await this.apiWrapper.getWorkerIdByRoleAccount(
      this.membersKeyPairs[0].address,
      this.module
    )
    const worker: Worker = await this.apiWrapper.getWorkerById(workerId, this.module)
    const reward: RewardRelationship = await this.apiWrapper.getRewardRelationship(worker.reward_relationship.unwrap())
    const now: BN = await this.apiWrapper.getBestBlock()
    const nextPaymentBlock: BN = new BN(reward.getField('next_payment_at_block').toString())
    const payoutInterval: BN = new BN(reward.getField('payout_interval').toString())
    const amountPerPayout: BN = new BN(reward.getField('amount_per_payout').toString())

    assert(now.lt(nextPaymentBlock), `Payout already happened in block ${nextPaymentBlock} now ${now}`)
    const balance: BN = await this.apiWrapper.getBalance(this.membersKeyPairs[0].address)

    const firstPayoutWaitingPeriod: BN = nextPaymentBlock.sub(now).addn(1)
    await Utils.wait(this.apiWrapper.getBlockDuration().mul(firstPayoutWaitingPeriod).toNumber())

    const balanceAfterFirstPayout: BN = await this.apiWrapper.getBalance(this.membersKeyPairs[0].address)
    const expectedBalanceFirst: BN = balance.add(amountPerPayout)
    assert(
      balanceAfterFirstPayout.eq(expectedBalanceFirst),
      `Unexpected balance, expected ${expectedBalanceFirst} got ${balanceAfterFirstPayout}`
    )

    const secondPayoutWaitingPeriod: BN = payoutInterval.addn(1)
    console.log('waiting period ' + secondPayoutWaitingPeriod)
    await Utils.wait(this.apiWrapper.getBlockDuration().mul(secondPayoutWaitingPeriod).toNumber())

    const balanceAfterSecondPayout: BN = await this.apiWrapper.getBalance(this.membersKeyPairs[0].address)
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

export class ExpectLeadOpeningAddedFixture implements Fixture {
  private apiWrapper: ApiWrapper

  private result: OpeningId | undefined
  private events: Event[] = []

  constructor(apiWrapper: ApiWrapper) {
    this.apiWrapper = apiWrapper
  }

  public getCreatedOpeningId(): OpeningId | undefined {
    return this.result
  }

  public getEvents(): Event[] {
    return this.events
  }

  public async runner(expectFailure: boolean): Promise<void> {
    const event: Event = await this.apiWrapper.expectEvent('OpeningAdded')
    this.events.push(event)
    this.result = (event.data as unknown) as OpeningId
    if (expectFailure) {
      throw new Error('Successful fixture run while expecting failure')
    }
  }
}

export class ExpectLeaderSetFixture implements Fixture {
  private apiWrapper: ApiWrapper
  private leaderAddress: string
  private module: WorkingGroups

  private result: WorkerId | undefined
  private events: Event[] = []

  constructor(apiWrapper: ApiWrapper, leaderAddress: string, module: WorkingGroups) {
    this.apiWrapper = apiWrapper
    this.leaderAddress = leaderAddress
    this.module = module
  }

  public getLeaderWorkerId(): WorkerId | undefined {
    return this.result
  }

  public getEvents(): Event[] {
    return this.events
  }

  public async runner(expectFailure: boolean): Promise<void> {
    const event: Event = await this.apiWrapper.expectEvent('LeaderSet')
    this.events.push(event)
    const leadWorkerId: WorkerId = (event.data as unknown) as WorkerId
    const worker: Worker = await this.apiWrapper.getWorkerById(leadWorkerId, this.module)
    const leaderApplicationId: ApplicationId = (
      await this.apiWrapper.getApplicationsIdsByRoleAccount(this.leaderAddress, this.module)
    )[0]
    const application: Application = await this.apiWrapper.getApplicationById(leaderApplicationId, this.module)
    assert(
      worker.role_account_id.eq(application.role_account_id),
      `Role account ids does not match, leader account: ${worker.role_account_id}, application account ${application.role_account_id}`
    )
    this.result = leadWorkerId
    if (expectFailure) {
      throw new Error('Successful fixture run while expecting failure')
    }
  }
}

export class ExpectBeganApplicationReviewFixture implements Fixture {
  private apiWrapper: ApiWrapper

  private result: ApplicationId | undefined
  private events: Event[] = []

  constructor(apiWrapper: ApiWrapper) {
    this.apiWrapper = apiWrapper
  }

  public getApplicationId(): ApplicationId | undefined {
    return this.result
  }

  public getEvents(): Event[] {
    return this.events
  }

  public async runner(expectFailure: boolean): Promise<void> {
    const event: Event = await this.apiWrapper.expectEvent('BeganApplicationReview')
    this.events.push(event)
    this.result = (event.data as unknown) as ApplicationId
    if (expectFailure) {
      throw new Error('Successful fixture run while expecting failure')
    }
  }
}

export class ExpectLeaderRoleTerminatedFixture implements Fixture {
  private apiWrapper: ApiWrapper
  private module: WorkingGroups

  private events: Event[] = []

  constructor(apiWrapper: ApiWrapper, module: WorkingGroups) {
    this.apiWrapper = apiWrapper
    this.module = module
  }

  public getEvents(): Event[] {
    return this.events
  }

  public async runner(expectFailure: boolean): Promise<void> {
    const event: Event = await this.apiWrapper.expectEvent('TerminatedLeader')
    this.events.push(event)
    const leadWorkerId: WorkerId | undefined = await this.apiWrapper.getLeadWorkerId(this.module)
    assert(leadWorkerId === undefined, `Unexpected lead worker id: ${leadWorkerId}, expected none`)
    if (expectFailure) {
      throw new Error('Successful fixture run while expecting failure')
    }
  }
}

export class ExpectLeaderRewardAmountUpdatedFixture implements Fixture {
  private apiWrapper: ApiWrapper
  private expectedReward: BN
  private module: WorkingGroups

  private events: Event[] = []

  constructor(apiWrapper: ApiWrapper, expectedReward: BN, module: WorkingGroups) {
    this.apiWrapper = apiWrapper
    this.expectedReward = expectedReward
    this.module = module
  }

  public getEvents(): Event[] {
    return this.events
  }

  public async runner(expectFailure: boolean): Promise<void> {
    const event: Event = await this.apiWrapper.expectEvent('WorkerRewardAmountUpdated')
    this.events.push(event)
    const leadWorkerId: WorkerId = (await this.apiWrapper.getLeadWorkerId(this.module))!
    const leadWorker: Worker = await this.apiWrapper.getWorkerById(leadWorkerId, this.module)
    const receivedReward: BN = (await this.apiWrapper.getRewardRelationship(leadWorker.reward_relationship.unwrap()))
      .amount_per_payout
    assert(
      receivedReward.eq(this.expectedReward),
      `Unexpected reward amount for worker with id ${leadWorkerId}: ${receivedReward}, expected ${this.expectedReward}`
    )
    if (expectFailure) {
      throw new Error('Successful fixture run while expecting failure')
    }
  }
}

export class ExpectLeaderStakeDecreasedFixture implements Fixture {
  private apiWrapper: ApiWrapper
  private expectedStake: BN
  private module: WorkingGroups

  private events: Event[] = []

  constructor(apiWrapper: ApiWrapper, expectedStake: BN, module: WorkingGroups) {
    this.apiWrapper = apiWrapper
    this.expectedStake = expectedStake
    this.module = module
  }

  public getEvents(): Event[] {
    return this.events
  }

  public async runner(expectFailure: boolean): Promise<void> {
    const event: Event = await this.apiWrapper.expectEvent('StakeDecreased')
    this.events.push(event)
    const leadWorkerId: WorkerId = (await this.apiWrapper.getLeadWorkerId(this.module))!
    const receivedStake: BN = await this.apiWrapper.getWorkerStakeAmount(leadWorkerId, this.module)
    assert(
      receivedStake.eq(this.expectedStake),
      `Unexpected stake amount for worker with id ${leadWorkerId}: ${receivedStake}, expected ${this.expectedStake}`
    )
    if (expectFailure) {
      throw new Error('Successful fixture run while expecting failure')
    }
  }
}

export class ExpectLeaderSlashedFixture implements Fixture {
  private apiWrapper: ApiWrapper
  private expectedStake: BN
  private module: WorkingGroups

  private events: Event[] = []

  constructor(apiWrapper: ApiWrapper, expectedStake: BN, module: WorkingGroups) {
    this.apiWrapper = apiWrapper
    this.expectedStake = expectedStake
    this.module = module
  }

  public getEvents(): Event[] {
    return this.events
  }

  public async runner(expectFailure: boolean): Promise<void> {
    const event: Event = await this.apiWrapper.expectEvent('StakeSlashed')
    this.events.push(event)
    const leadWorkerId: WorkerId = (await this.apiWrapper.getLeadWorkerId(this.module))!
    const receivedStake: BN = await this.apiWrapper.getWorkerStakeAmount(leadWorkerId, this.module)
    assert(
      receivedStake.eq(this.expectedStake),
      `Unexpected stake amount for worker with id after slash ${leadWorkerId}: ${receivedStake}, expected ${this.expectedStake}`
    )
    if (expectFailure) {
      throw new Error('Successful fixture run while expecting failure')
    }
  }
}

export class ExpectMintCapacityChangedFixture implements Fixture {
  private apiWrapper: ApiWrapper
  private expectedMintCapacity: BN

  private result: BN | undefined
  private events: Event[] = []

  constructor(apiWrapper: ApiWrapper, expectedMintCapacity: BN) {
    this.apiWrapper = apiWrapper
    this.expectedMintCapacity = expectedMintCapacity
  }

  public getResult(): BN | undefined {
    return this.result
  }

  public getEvents(): Event[] {
    return this.events
  }

  public async runner(expectFailure: boolean): Promise<void> {
    const event: Event = await this.apiWrapper.expectEvent('MintCapacityChanged')
    this.events.push(event)
    const receivedMintCapacity: BN = (event.data[1] as unknown) as BN
    assert(
      receivedMintCapacity.eq(this.expectedMintCapacity),
      `Unexpected mint capacity: ${receivedMintCapacity}, expected ${this.expectedMintCapacity}`
    )
    this.result = receivedMintCapacity
    if (expectFailure) {
      throw new Error('Successful fixture run while expecting failure')
    }
  }
}
