import { Balance, BlockNumber } from '@polkadot/types/interfaces'
import { Option } from '@polkadot/types'
import BaseTransport from './base'
import { ApiPromise } from '@polkadot/api'
import MembersTransport from './members'
import {
  Worker,
  WorkerId,
  Opening as WGOpening,
  Application as WGApplication,
  OpeningTypeKey,
} from '@joystream/types/working-group'
import { apiModuleByGroup, openingPolicyUnstakingPeriodsKeys } from '../consts/workingGroups'
import { InputValidationLengthConstraint, WorkingGroupKey } from '@joystream/types/common'
import {
  WorkerData,
  ParsedApplication,
  UnstakingPeriods,
  StakingPolicyUnstakingPeriodKey,
  OpeningStatus,
  GroupOpeningStage,
  ParsedOpening,
  OpeningPair,
} from '../types/workingGroups'
import {
  OpeningId,
  ApplicationId,
  ActiveOpeningStageKey,
  StakingPolicy,
  OpeningStage,
  Opening,
} from '@joystream/types/hiring'
import { StakeId } from '@joystream/types/stake'
import { APIQueryCache } from './APIQueryCache'
import BN from 'bn.js'
import ChainTransport from './chain'

export default class WorkingGroupsTransport extends BaseTransport {
  private membersT: MembersTransport
  private chainT: ChainTransport

  constructor(
    api: ApiPromise,
    cacheApi: APIQueryCache,
    membersTransport: MembersTransport,
    chainTransport: ChainTransport
  ) {
    super(api, cacheApi)
    this.membersT = membersTransport
    this.chainT = chainTransport
  }

  // Returns api.query[module] based on provided group
  public apiQueryByGroup(group: WorkingGroupKey) {
    const module = apiModuleByGroup[group]

    return this.api.query[module]
  }

  // Returns cachedApi.query[module] based on provided group (same-block results caching)
  public queryByGroup(group: WorkingGroupKey) {
    const module = apiModuleByGroup[group]

    return this.cacheApi.query[module]
  }

  // Fetches and returns working group opening by id - throws an error if not found
  async wgOpeningById(group: WorkingGroupKey, id: number): Promise<WGOpening> {
    const wgOpening = await this.queryByGroup(group).openingById(id)
    if (wgOpening.isEmpty) {
      throw new Error(`Invalid ${group} Working Group opening id: ${id}`)
    }

    return wgOpening
  }

  // Fetches and returns working group application by id. Throws an error if not found
  public async wgApplicationById(
    group: WorkingGroupKey,
    wgApplicationId: number | ApplicationId
  ): Promise<WGApplication> {
    const wgApplication = await this.queryByGroup(group).applicationById(wgApplicationId)

    if (wgApplication.isEmpty) {
      throw new Error(`${group} Working Group application not found (ID: ${wgApplicationId.toString()})!`)
    }

    return wgApplication
  }

  // Fetches and returns Worker by id - throws an error if not found
  public async workerById(group: WorkingGroupKey, workerId: number | WorkerId): Promise<Worker> {
    const worker = await this.queryByGroup(group).workerById(workerId)

    if (worker.isEmpty) {
      throw new Error(`${group} Group Worker not found by id: ${workerId}!`)
    }

    return worker
  }

  // Fetches and returns stake value by StakeId
  protected async stakeValue(stakeId: StakeId): Promise<Balance> {
    const stake = await this.stake.stakes(stakeId)

    return stake.value
  }

  // Fetches and returns group member data (profile, stake, reward etc.) by group and workerId
  public async groupMemberById(group: WorkingGroupKey, workerId: number): Promise<WorkerData> {
    const worker = await this.workerById(group, workerId)
    return this.parseGroupMember(group, worker, workerId)
  }

  // Fetches and returns current working group lead id (or null if no lead is set)
  public async currentLeadId(group: WorkingGroupKey): Promise<WorkerId | null> {
    return (await this.queryByGroup(group).currentLead()).unwrapOr(null)
  }

  // Fetches and returns current lead member/worker data (profile, stake, reward ec.)
  public async currentLead(group: WorkingGroupKey): Promise<WorkerData | null> {
    const leadId = await this.currentLeadId(group)

    return leadId ? this.groupMemberById(group, leadId.toNumber()) : null
  }

  // Return all working group parsed members data by group
  public async groupMembers(group: WorkingGroupKey, sort: 'ASC' | 'DESC' = 'DESC'): Promise<WorkerData[]> {
    const workerEntries = await this.allWorkers(group)

    const groupMembers: WorkerData[] = await Promise.all(
      workerEntries.map(([id, worker]) => this.parseGroupMember(group, worker, id.toNumber()))
    )

    return sort === 'ASC' ? groupMembers : groupMembers.reverse()
  }

  // Fetches and returns working group opening pairs (hiring + working-group module) by group
  // and optionally - type (Lead/Worker)
  public async openingPairs(group: WorkingGroupKey, type?: OpeningTypeKey): Promise<OpeningPair[]> {
    const wgOpeningEntries = await this.entriesByIds<OpeningId, WGOpening>(this.apiQueryByGroup(group).openingById)
    const hiringOpenings = await Promise.all(
      wgOpeningEntries.map(([, wgOpening]) => this.hiring.openingById(wgOpening.hiring_opening_id))
    )

    return hiringOpenings
      .map((hiringOpening, index) => {
        const id = wgOpeningEntries[index][0]
        const opening = wgOpeningEntries[index][1]

        return { id, opening, hiringOpening }
      })
      .filter((openingData) => !type || openingData.opening.opening_type.isOfType(type))
  }

  // Fetches and returns working group active opening pairs (hiring + working-group module) by group
  // and optionally - substage (AcceptingApplication/InReview/Deactivated) and/or type (Leader/Worker)
  public async activeOpeningPairs(
    group: WorkingGroupKey,
    substage?: ActiveOpeningStageKey,
    type?: OpeningTypeKey
  ): Promise<OpeningPair[]> {
    return (await this.openingPairs(group, type)).filter(
      (od) =>
        od.hiringOpening.stage.isOfType('Active') &&
        (!substage || od.hiringOpening.stage.asType('Active').stage.isOfType(substage))
    )
  }

  // Fetches and returns parsed openigns data (openings along with all applications, member profiles, stakes etc.)
  public async parsedOpenings(group: WorkingGroupKey): Promise<ParsedOpening[]> {
    const openings = await this.entriesByIds<OpeningId, WGOpening>(this.apiQueryByGroup(group).openingById)
    return Promise.all(openings.map(([id, opening]) => this.parseOpening(group, opening, id.toNumber())))
  }

  // Fetches and returns parsed opening data (opening along with all applications, member profiles, stakes etc.)
  public async parsedOpening(group: WorkingGroupKey, id: number): Promise<ParsedOpening> {
    const wgOpening = await this.wgOpeningById(group, id)
    return this.parseOpening(group, wgOpening, id)
  }

  // Fetches and parses working group application data (stake values, member profile etc.) by group and id
  async parsedApplicationById(group: WorkingGroupKey, wgApplicationId: number): Promise<ParsedApplication> {
    const wgApplication = await this.wgApplicationById(group, wgApplicationId)

    return this.parseApplication(wgApplicationId, wgApplication)
  }

  // Fetches and parses working group opening applications by group and working group opening id
  async openingApplications(group: WorkingGroupKey, wgOpeningId: number): Promise<ParsedApplication[]> {
    const wgApplicationsEntries = await this.entriesByIds<ApplicationId, WGApplication>(
      this.apiQueryByGroup(group).applicationById
    )

    return Promise.all(
      wgApplicationsEntries
        .filter(([, wgApplication]) => wgApplication.opening_id.eq(wgOpeningId))
        .map(([wgApplicationId, wgApplication]) => this.parseApplication(wgApplicationId.toNumber(), wgApplication))
    )
  }

  // Fetches and parses working group opening ACTIVE applications by group and working group opening id
  async openingActiveApplications(group: WorkingGroupKey, wgOpeningId: number): Promise<ParsedApplication[]> {
    return (await this.openingApplications(group, wgOpeningId)).filter((a) => a.stage.isOfType('Active'))
  }

  // Fetches and returns all working group workers (including lead) as [WorkerId, Worker] entries
  async allWorkers(group: WorkingGroupKey) {
    return this.entriesByIds<WorkerId, Worker>(this.apiQueryByGroup(group).workerById)
  }

  // Fetches and returns working current worker exit rationale constraint
  async workerExitRationaleConstraint(group: WorkingGroupKey): Promise<InputValidationLengthConstraint> {
    return this.apiQueryByGroup(group).workerExitRationaleText()
  }

  // === PARSERS ===

  protected async parseOpening(
    group: WorkingGroupKey,
    wgOpening: WGOpening,
    wgOpeningId: number
  ): Promise<ParsedOpening> {
    const openingId = wgOpening.hiring_opening_id.toNumber()
    const opening = await this.hiring.openingById(openingId)
    const applications = await this.openingApplications(group, wgOpeningId)
    const stage = await this.parseOpeningStage(opening.stage)
    const type = wgOpening.opening_type
    const { application_staking_policy: applSP, role_staking_policy: roleSP } = opening
    const stakes = {
      application: applSP.unwrapOr(undefined),
      role: roleSP.unwrapOr(undefined),
    }
    const unstakingPeriods = this.parseUnstakingPeriods(wgOpening, opening)

    return {
      wgOpeningId,
      openingId,
      opening,
      stage,
      stakes,
      applications,
      type,
      unstakingPeriods: unstakingPeriods,
    }
  }

  protected parseUnstakingPeriods(wgOpening: WGOpening, opening: Opening): UnstakingPeriods {
    const { application_staking_policy: applSP, role_staking_policy: roleSP } = opening
    const unstakingPeriod = (period: Option<BlockNumber>) => period.unwrapOr(new BN(0)).toNumber()
    const spUnstakingPeriod = (sp: Option<StakingPolicy>, key: StakingPolicyUnstakingPeriodKey) =>
      sp.isSome ? unstakingPeriod(sp.unwrap()[key]) : 0

    const unstakingPeriods: Partial<UnstakingPeriods> = {
      'review_period_expired_application_stake_unstaking_period_length': spUnstakingPeriod(
        applSP,
        'review_period_expired_unstaking_period_length'
      ),
      'crowded_out_application_stake_unstaking_period_length': spUnstakingPeriod(
        applSP,
        'crowded_out_unstaking_period_length'
      ),
      'review_period_expired_role_stake_unstaking_period_length': spUnstakingPeriod(
        roleSP,
        'review_period_expired_unstaking_period_length'
      ),
      'crowded_out_role_stake_unstaking_period_length': spUnstakingPeriod(
        roleSP,
        'crowded_out_unstaking_period_length'
      ),
    }

    openingPolicyUnstakingPeriodsKeys.forEach((key) => {
      unstakingPeriods[key] = unstakingPeriod(wgOpening.policy_commitment[key])
    })

    return unstakingPeriods as UnstakingPeriods
  }

  protected async parseOpeningStage(stage: OpeningStage): Promise<GroupOpeningStage> {
    let status: OpeningStatus | undefined, stageBlock: number | undefined, stageDate: Date | undefined

    if (stage.isOfType('WaitingToBegin')) {
      const stageData = stage.asType('WaitingToBegin')
      const currentBlockNumber = (await this.chainT.bestBlock()).toNumber()
      const expectedBlockTime = this.api.consts.babe.expectedBlockTime.toNumber()
      status = OpeningStatus.WaitingToBegin
      stageBlock = stageData.begins_at_block.toNumber()
      stageDate = new Date(Date.now() + (stageBlock - currentBlockNumber) * expectedBlockTime)
    }

    if (stage.isOfType('Active')) {
      const stageData = stage.asType('Active')
      const substage = stageData.stage
      if (substage.isOfType('AcceptingApplications')) {
        status = OpeningStatus.AcceptingApplications
        stageBlock = substage.asType('AcceptingApplications').started_accepting_applicants_at_block.toNumber()
      }
      if (substage.isOfType('ReviewPeriod')) {
        status = OpeningStatus.InReview
        stageBlock = substage.asType('ReviewPeriod').started_review_period_at_block.toNumber()
      }
      if (substage.isOfType('Deactivated')) {
        status = substage.asType('Deactivated').cause.isOfType('Filled')
          ? OpeningStatus.Complete
          : OpeningStatus.Cancelled
        stageBlock = substage.asType('Deactivated').deactivated_at_block.toNumber()
      }
      if (stageBlock) {
        stageDate = new Date(await this.chainT.blockTimestamp(stageBlock))
      }
    }

    return {
      status: status || OpeningStatus.Unknown,
      block: stageBlock,
      date: stageDate,
    }
  }

  protected async parseGroupMember(group: WorkingGroupKey, worker: Worker, workerId: number): Promise<WorkerData> {
    const stake = worker.role_stake_profile.isSome
      ? await this.stakeValue(worker.role_stake_profile.unwrap().stake_id)
      : undefined

    const reward = worker.reward_relationship.isSome
      ? await this.recurringRewards.rewardRelationships(worker.reward_relationship.unwrap())
      : undefined

    const memberId = worker.member_id.toNumber()
    const profile = await this.membersT.expectedMembership(memberId)
    const roleAccount = worker.role_account_id

    return { group, workerId, worker, profile, memberId, stake, reward, roleAccount }
  }

  protected async parseApplication(wgApplicationId: number, wgApplication: WGApplication): Promise<ParsedApplication> {
    const appId = wgApplication.application_id
    const application = await this.hiring.applicationById(appId)

    const { active_role_staking_id: roleStakingId, active_application_staking_id: appStakingId } = application

    const applStake = appStakingId.isSome ? await this.stakeValue(appStakingId.unwrap()) : new BN(0)
    const roleStake = roleStakingId.isSome ? await this.stakeValue(roleStakingId.unwrap()) : new BN(0)

    return {
      wgApplicationId,
      applicationId: appId.toNumber(),
      wgOpeningId: wgApplication.opening_id.toNumber(),
      member: await this.membersT.expectedMembership(wgApplication.member_id),
      roleAccout: wgApplication.role_account_id,
      stakes: { application: applStake, role: roleStake, total: applStake.add(roleStake) },
      humanReadableText: application.human_readable_text.toString(),
      stage: application.stage,
    }
  }
}
