import BN from 'bn.js'
import { types } from '@joystream/types/'
import { ApiPromise, WsProvider } from '@polkadot/api'
import { QueryableStorageMultiArg, SubmittableExtrinsic, QueryableStorageEntry } from '@polkadot/api/types'
import { formatBalance } from '@polkadot/util'
import { Balance, Moment, BlockNumber } from '@polkadot/types/interfaces'
import { KeyringPair } from '@polkadot/keyring/types'
import { Codec, CodecArg } from '@polkadot/types/types'
import { Option, Vec, UInt } from '@polkadot/types'
import {
  AccountSummary,
  CouncilInfoObj,
  CouncilInfoTuple,
  createCouncilInfoObj,
  WorkingGroups,
  Reward,
  GroupMember,
  OpeningStatus,
  GroupOpeningStage,
  GroupOpening,
  GroupApplication,
  openingPolicyUnstakingPeriodsKeys,
  UnstakingPeriods,
  StakingPolicyUnstakingPeriodKey,
} from './Types'
import { DeriveBalancesAll } from '@polkadot/api-derive/types'
import { CLIError } from '@oclif/errors'
import ExitCodes from './ExitCodes'
import {
  Worker,
  WorkerId,
  RoleStakeProfile,
  Opening as WGOpening,
  Application as WGApplication,
} from '@joystream/types/working-group'
import {
  Opening,
  Application,
  OpeningStage,
  ApplicationStageKeys,
  ApplicationId,
  OpeningId,
  StakingPolicy,
} from '@joystream/types/hiring'
import { MemberId, Membership } from '@joystream/types/members'
import { RewardRelationship, RewardRelationshipId } from '@joystream/types/recurring-rewards'
import { Stake, StakeId } from '@joystream/types/stake'

import { InputValidationLengthConstraint } from '@joystream/types/common'

export const DEFAULT_API_URI = 'ws://localhost:9944/'
const DEFAULT_DECIMALS = new BN(12)

// Mapping of working group to api module
export const apiModuleByGroup: { [key in WorkingGroups]: string } = {
  [WorkingGroups.StorageProviders]: 'storageWorkingGroup',
}

// Api wrapper for handling most common api calls and allowing easy API implementation switch in the future
export default class Api {
  private _api: ApiPromise

  private constructor(originalApi: ApiPromise) {
    this._api = originalApi
  }

  public getOriginalApi(): ApiPromise {
    return this._api
  }

  private static async initApi(apiUri: string = DEFAULT_API_URI): Promise<ApiPromise> {
    const wsProvider: WsProvider = new WsProvider(apiUri)
    const api = await ApiPromise.create({ provider: wsProvider, types })

    // Initializing some api params based on pioneer/packages/react-api/Api.tsx
    const [properties] = await Promise.all([api.rpc.system.properties()])

    const tokenSymbol = properties.tokenSymbol.unwrapOr('DEV').toString()
    const tokenDecimals = properties.tokenDecimals.unwrapOr(DEFAULT_DECIMALS).toNumber()

    // formatBlanace config
    formatBalance.setDefaults({
      decimals: tokenDecimals,
      unit: tokenSymbol,
    })

    return api
  }

  static async create(apiUri: string = DEFAULT_API_URI): Promise<Api> {
    const originalApi: ApiPromise = await Api.initApi(apiUri)
    return new Api(originalApi)
  }

  private async queryMultiOnce(queries: Parameters<typeof ApiPromise.prototype.queryMulti>[0]): Promise<Codec[]> {
    let results: Codec[] = []

    const unsub = await this._api.queryMulti(queries, (res) => {
      results = res
    })
    unsub()

    if (!results.length || results.length !== queries.length) {
      throw new CLIError('API querying issue', { exit: ExitCodes.ApiError })
    }

    return results
  }

  async getAccountsBalancesInfo(accountAddresses: string[]): Promise<DeriveBalancesAll[]> {
    const accountsBalances: DeriveBalancesAll[] = await Promise.all(
      accountAddresses.map((addr) => this._api.derive.balances.all(addr))
    )

    return accountsBalances
  }

  // Get on-chain data related to given account.
  // For now it's just account balances
  async getAccountSummary(accountAddresses: string): Promise<AccountSummary> {
    const balances: DeriveBalancesAll = (await this.getAccountsBalancesInfo([accountAddresses]))[0]
    // TODO: Some more information can be fetched here in the future

    return { balances }
  }

  async getCouncilInfo(): Promise<CouncilInfoObj> {
    const queries: { [P in keyof CouncilInfoObj]: QueryableStorageMultiArg<'promise'> } = {
      activeCouncil: this._api.query.council.activeCouncil,
      termEndsAt: this._api.query.council.termEndsAt,
      autoStart: this._api.query.councilElection.autoStart,
      newTermDuration: this._api.query.councilElection.newTermDuration,
      candidacyLimit: this._api.query.councilElection.candidacyLimit,
      councilSize: this._api.query.councilElection.councilSize,
      minCouncilStake: this._api.query.councilElection.minCouncilStake,
      minVotingStake: this._api.query.councilElection.minVotingStake,
      announcingPeriod: this._api.query.councilElection.announcingPeriod,
      votingPeriod: this._api.query.councilElection.votingPeriod,
      revealingPeriod: this._api.query.councilElection.revealingPeriod,
      round: this._api.query.councilElection.round,
      stage: this._api.query.councilElection.stage,
    }
    const results: CouncilInfoTuple = (await this.queryMultiOnce(Object.values(queries))) as CouncilInfoTuple

    return createCouncilInfoObj(...results)
  }

  async estimateFee(account: KeyringPair, tx: SubmittableExtrinsic<'promise'>): Promise<Balance> {
    const paymentInfo = await tx.paymentInfo(account)
    return paymentInfo.partialFee
  }

  createTransferTx(recipient: string, amount: BN) {
    return this._api.tx.balances.transfer(recipient, amount)
  }

  // Working groups
  // TODO: This is a lot of repeated logic from "/pioneer/joy-utils/transport"
  // It will be refactored to "joystream-js" soon
  async entriesByIds<IDType extends UInt, ValueType extends Codec>(
    apiMethod: QueryableStorageEntry<'promise'>,
    firstKey?: CodecArg // First key in case of double maps
  ): Promise<[IDType, ValueType][]> {
    const entries: [IDType, ValueType][] = (await apiMethod.entries<ValueType>(firstKey)).map(([storageKey, value]) => [
      // If double-map (first key is provided), we map entries by second key
      storageKey.args[firstKey !== undefined ? 1 : 0] as IDType,
      value,
    ])

    return entries.sort((a, b) => a[0].toNumber() - b[0].toNumber())
  }

  protected async blockHash(height: number): Promise<string> {
    const blockHash = await this._api.rpc.chain.getBlockHash(height)

    return blockHash.toString()
  }

  protected async blockTimestamp(height: number): Promise<Date> {
    const blockTime = (await this._api.query.timestamp.now.at(await this.blockHash(height))) as Moment

    return new Date(blockTime.toNumber())
  }

  protected workingGroupApiQuery(group: WorkingGroups) {
    const module = apiModuleByGroup[group]
    return this._api.query[module]
  }

  protected async membershipById(memberId: MemberId): Promise<Membership | null> {
    const profile = (await this._api.query.members.membershipById(memberId)) as Membership

    // Can't just use profile.isEmpty because profile.suspended is Bool (which isEmpty method always returns false)
    return profile.handle.isEmpty ? null : profile
  }

  async groupLead(group: WorkingGroups): Promise<GroupMember | null> {
    const optLeadId = (await this.workingGroupApiQuery(group).currentLead()) as Option<WorkerId>

    if (!optLeadId.isSome) {
      return null
    }

    const leadWorkerId = optLeadId.unwrap()
    const leadWorker = await this.workerByWorkerId(group, leadWorkerId.toNumber())

    return await this.parseGroupMember(leadWorkerId, leadWorker)
  }

  protected async stakeValue(stakeId: StakeId): Promise<Balance> {
    const stake = await this._api.query.stake.stakes<Stake>(stakeId)
    return stake.value
  }

  protected async workerStake(stakeProfile: RoleStakeProfile): Promise<Balance> {
    return this.stakeValue(stakeProfile.stake_id)
  }

  protected async workerReward(relationshipId: RewardRelationshipId): Promise<Reward> {
    const rewardRelationship = await this._api.query.recurringRewards.rewardRelationships<RewardRelationship>(
      relationshipId
    )

    return {
      totalRecieved: rewardRelationship.total_reward_received,
      value: rewardRelationship.amount_per_payout,
      interval: rewardRelationship.payout_interval.unwrapOr(undefined)?.toNumber(),
      nextPaymentBlock: rewardRelationship.next_payment_at_block.unwrapOr(new BN(0)).toNumber(),
    }
  }

  protected async parseGroupMember(id: WorkerId, worker: Worker): Promise<GroupMember> {
    const roleAccount = worker.role_account_id
    const memberId = worker.member_id

    const profile = await this.membershipById(memberId)

    if (!profile) {
      throw new Error(`Group member profile not found! (member id: ${memberId.toNumber()})`)
    }

    let stake: Balance | undefined
    if (worker.role_stake_profile && worker.role_stake_profile.isSome) {
      stake = await this.workerStake(worker.role_stake_profile.unwrap())
    }

    let reward: Reward | undefined
    if (worker.reward_relationship && worker.reward_relationship.isSome) {
      reward = await this.workerReward(worker.reward_relationship.unwrap())
    }

    return {
      workerId: id,
      roleAccount,
      memberId,
      profile,
      stake,
      reward,
    }
  }

  async workerByWorkerId(group: WorkingGroups, workerId: number): Promise<Worker> {
    const nextId = await this.workingGroupApiQuery(group).nextWorkerId<WorkerId>()

    // This is chain specfic, but if next id is still 0, it means no workers have been added yet
    if (workerId < 0 || workerId >= nextId.toNumber()) {
      throw new CLIError('Invalid worker id!')
    }

    const worker = await this.workingGroupApiQuery(group).workerById<Worker>(workerId)

    if (worker.isEmpty) {
      throw new CLIError('This worker is not active anymore')
    }

    return worker
  }

  async groupMember(group: WorkingGroups, workerId: number) {
    const worker = await this.workerByWorkerId(group, workerId)
    return await this.parseGroupMember(this._api.createType('WorkerId', workerId), worker)
  }

  async groupMembers(group: WorkingGroups): Promise<GroupMember[]> {
    const workerEntries = await this.entriesByIds<WorkerId, Worker>(this.workingGroupApiQuery(group).workerById)

    const groupMembers: GroupMember[] = await Promise.all(
      workerEntries.map(([id, worker]) => this.parseGroupMember(id, worker))
    )

    return groupMembers.reverse() // Sort by newest
  }

  async openingsByGroup(group: WorkingGroups): Promise<GroupOpening[]> {
    let openings: GroupOpening[] = []
    const nextId = await this.workingGroupApiQuery(group).nextOpeningId<OpeningId>()

    // This is chain specfic, but if next id is still 0, it means no openings have been added yet
    if (!nextId.eq(0)) {
      const ids = Array.from(Array(nextId.toNumber()).keys()).reverse() // Sort by newest
      openings = await Promise.all(ids.map((id) => this.groupOpening(group, id)))
    }

    return openings
  }

  protected async hiringOpeningById(id: number | OpeningId): Promise<Opening> {
    const result = await this._api.query.hiring.openingById<Opening>(id)
    return result
  }

  protected async hiringApplicationById(id: number | ApplicationId): Promise<Application> {
    const result = await this._api.query.hiring.applicationById<Application>(id)
    return result
  }

  async wgApplicationById(group: WorkingGroups, wgApplicationId: number): Promise<WGApplication> {
    const nextAppId = await this.workingGroupApiQuery(group).nextApplicationId<ApplicationId>()

    if (wgApplicationId < 0 || wgApplicationId >= nextAppId.toNumber()) {
      throw new CLIError('Invalid working group application ID!')
    }

    const result = await this.workingGroupApiQuery(group).applicationById<WGApplication>(wgApplicationId)
    return result
  }

  protected async parseApplication(wgApplicationId: number, wgApplication: WGApplication): Promise<GroupApplication> {
    const appId = wgApplication.application_id
    const application = await this.hiringApplicationById(appId)

    const { active_role_staking_id: roleStakingId, active_application_staking_id: appStakingId } = application

    return {
      wgApplicationId,
      applicationId: appId.toNumber(),
      wgOpeningId: wgApplication.opening_id.toNumber(),
      member: await this.membershipById(wgApplication.member_id),
      roleAccout: wgApplication.role_account_id,
      stakes: {
        application: appStakingId.isSome ? (await this.stakeValue(appStakingId.unwrap())).toNumber() : 0,
        role: roleStakingId.isSome ? (await this.stakeValue(roleStakingId.unwrap())).toNumber() : 0,
      },
      humanReadableText: application.human_readable_text.toString(),
      stage: application.stage.type as ApplicationStageKeys,
    }
  }

  async groupApplication(group: WorkingGroups, wgApplicationId: number): Promise<GroupApplication> {
    const wgApplication = await this.wgApplicationById(group, wgApplicationId)
    return await this.parseApplication(wgApplicationId, wgApplication)
  }

  protected async groupOpeningApplications(group: WorkingGroups, wgOpeningId: number): Promise<GroupApplication[]> {
    const wgApplicationEntries = await this.entriesByIds<ApplicationId, WGApplication>(
      this.workingGroupApiQuery(group).applicationById
    )

    return Promise.all(
      wgApplicationEntries
        .filter(([, /* id */ wgApplication]) => wgApplication.opening_id.eqn(wgOpeningId))
        .map(([id, wgApplication]) => this.parseApplication(id.toNumber(), wgApplication))
    )
  }

  async groupOpening(group: WorkingGroups, wgOpeningId: number): Promise<GroupOpening> {
    const nextId = ((await this.workingGroupApiQuery(group).nextOpeningId()) as OpeningId).toNumber()

    if (wgOpeningId < 0 || wgOpeningId >= nextId) {
      throw new CLIError('Invalid working group opening ID!')
    }

    const groupOpening = await this.workingGroupApiQuery(group).openingById<WGOpening>(wgOpeningId)

    const openingId = groupOpening.hiring_opening_id.toNumber()
    const opening = await this.hiringOpeningById(openingId)
    const applications = await this.groupOpeningApplications(group, wgOpeningId)
    const stage = await this.parseOpeningStage(opening.stage)
    const type = groupOpening.opening_type
    const { application_staking_policy: applSP, role_staking_policy: roleSP } = opening
    const stakes = {
      application: applSP.unwrapOr(undefined),
      role: roleSP.unwrapOr(undefined),
    }

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
      unstakingPeriods[key] = unstakingPeriod(groupOpening.policy_commitment[key])
    })

    return {
      wgOpeningId,
      openingId,
      opening,
      stage,
      stakes,
      applications,
      type,
      unstakingPeriods: unstakingPeriods as UnstakingPeriods,
    }
  }

  async parseOpeningStage(stage: OpeningStage): Promise<GroupOpeningStage> {
    let status: OpeningStatus | undefined, stageBlock: number | undefined, stageDate: Date | undefined

    if (stage.isOfType('WaitingToBegin')) {
      const stageData = stage.asType('WaitingToBegin')
      const currentBlockNumber = (await this._api.derive.chain.bestNumber()).toNumber()
      const expectedBlockTime = (this._api.consts.babe.expectedBlockTime as Moment).toNumber()
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
        stageDate = new Date(await this.blockTimestamp(stageBlock))
      }
    }

    return {
      status: status || OpeningStatus.Unknown,
      block: stageBlock,
      date: stageDate,
    }
  }

  async getMemberIdsByControllerAccount(address: string): Promise<MemberId[]> {
    const ids = await this._api.query.members.memberIdsByControllerAccountId<Vec<MemberId>>(address)
    return ids.toArray()
  }

  async workerExitRationaleConstraint(group: WorkingGroups): Promise<InputValidationLengthConstraint> {
    return await this.workingGroupApiQuery(group).workerExitRationaleText<InputValidationLengthConstraint>()
  }
}
