import BN from 'bn.js'
import { createType, types } from '@joystream/types/'
import { ApiPromise, WsProvider } from '@polkadot/api'
import { SubmittableExtrinsic, AugmentedQuery } from '@polkadot/api/types'
import { formatBalance } from '@polkadot/util'
import { Balance, LockIdentifier } from '@polkadot/types/interfaces'
import { KeyringPair } from '@polkadot/keyring/types'
import { Codec, Observable } from '@polkadot/types/types'
import { UInt } from '@polkadot/types'
import {
  AccountSummary,
  WorkingGroups,
  Reward,
  GroupMember,
  ApplicationDetails,
  OpeningDetails,
  UnaugmentedApiPromise,
  MemberDetails,
  AvailableGroups,
} from './Types'
import { DeriveBalancesAll } from '@polkadot/api-derive/types'
import { CLIError } from '@oclif/errors'
import { Worker, WorkerId, OpeningId, Application, ApplicationId, Opening } from '@joystream/types/working-group'
import { Membership, StakingAccountMemberBinding } from '@joystream/types/members'
import { MemberId, ChannelId, AccountId } from '@joystream/types/common'
import {
  Channel,
  Video,
  ChannelCategoryId,
  VideoId,
  CuratorGroupId,
  CuratorGroup,
  VideoCategoryId,
} from '@joystream/types/content'
import { BagId, DataObject, DataObjectId } from '@joystream/types/storage'
import QueryNodeApi from './QueryNodeApi'
import { MembershipFieldsFragment } from './graphql/generated/queries'
import { blake2AsHex } from '@polkadot/util-crypto'

export const DEFAULT_API_URI = 'ws://localhost:9944/'

// Mapping of working group to api module
export const apiModuleByGroup = {
  [WorkingGroups.StorageProviders]: 'storageWorkingGroup',
  [WorkingGroups.Curators]: 'contentWorkingGroup',
  [WorkingGroups.Forum]: 'forumWorkingGroup',
  [WorkingGroups.Membership]: 'membershipWorkingGroup',
  [WorkingGroups.Gateway]: 'gatewayWorkingGroup',
  [WorkingGroups.OperationsAlpha]: 'operationsWorkingGroupAlpha',
  [WorkingGroups.OperationsBeta]: 'operationsWorkingGroupBeta',
  [WorkingGroups.OperationsGamma]: 'operationsWorkingGroupGamma',
  [WorkingGroups.Distribution]: 'distributionWorkingGroup',
} as const

// Api wrapper for handling most common api calls and allowing easy API implementation switch in the future
export default class Api {
  private _api: ApiPromise
  private _qnApi: QueryNodeApi | undefined
  public isDevelopment = false

  private constructor(originalApi: ApiPromise, isDevelopment: boolean, qnApi?: QueryNodeApi) {
    this.isDevelopment = isDevelopment
    this._api = originalApi
    this._qnApi = qnApi
  }

  public getOriginalApi(): ApiPromise {
    return this._api
  }

  // Get api for use-cases where no type augmentations are desirable
  public getUnaugmentedApi(): UnaugmentedApiPromise {
    return (this._api as unknown) as UnaugmentedApiPromise
  }

  private static async initApi(apiUri: string = DEFAULT_API_URI, metadataCache: Record<string, any>) {
    const wsProvider: WsProvider = new WsProvider(apiUri)
    const api = new ApiPromise({ provider: wsProvider, types, metadata: metadataCache })
    await api.isReadyOrError

    const [properties, chainType] = await Promise.all([api.rpc.system.properties(), api.rpc.system.chainType()])

    const tokenSymbol = properties.tokenSymbol.unwrap()[0].toString()
    const tokenDecimals = properties.tokenDecimals.unwrap()[0].toNumber()

    // formatBlanace config
    formatBalance.setDefaults({
      decimals: tokenDecimals,
      unit: tokenSymbol,
    })

    return { api, properties, chainType }
  }

  static async create(
    apiUri = DEFAULT_API_URI,
    metadataCache: Record<string, any>,
    qnApi?: QueryNodeApi
  ): Promise<Api> {
    const { api, chainType } = await Api.initApi(apiUri, metadataCache)
    return new Api(api, chainType.isDevelopment || chainType.isLocal, qnApi)
  }

  async bestNumber(): Promise<number> {
    return (await this._api.derive.chain.bestNumber()).toNumber()
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

  async estimateFee(account: KeyringPair, tx: SubmittableExtrinsic<'promise'>): Promise<Balance> {
    const paymentInfo = await tx.paymentInfo(account)
    return paymentInfo.partialFee
  }

  // Working groups
  async entriesByIds<IDType extends UInt, ValueType extends Codec>(
    apiMethod: AugmentedQuery<'promise', (key: IDType) => Observable<ValueType>, [IDType]>
  ): Promise<[IDType, ValueType][]> {
    const entries: [IDType, ValueType][] = (await apiMethod.entries()).map(([storageKey, value]) => [
      storageKey.args[0] as IDType,
      value,
    ])

    return entries.sort((a, b) => a[0].toNumber() - b[0].toNumber())
  }

  protected async blockHash(height: number): Promise<string> {
    const blockHash = await this._api.rpc.chain.getBlockHash(height)

    return blockHash.toString()
  }

  protected async blockTimestamp(height: number): Promise<Date> {
    const blockTime = await this._api.query.timestamp.now.at(await this.blockHash(height))

    return new Date(blockTime.toNumber())
  }

  protected workingGroupApiQuery<T extends WorkingGroups>(group: T): ApiPromise['query'][typeof apiModuleByGroup[T]] {
    const module = apiModuleByGroup[group]
    return this._api.query[module]
  }

  async membersDetails(entries: [MemberId, Membership][]): Promise<MemberDetails[]> {
    const membersQnData = await this._qnApi?.membersByIds(entries.map(([id]) => id))
    const memberQnDataById = new Map<string, MembershipFieldsFragment>()
    membersQnData?.forEach((m) => {
      memberQnDataById.set(m.id, m)
    })

    return entries.map(([memberId, membership]) => ({
      id: memberId,
      handle: memberQnDataById.get(memberId.toString())?.handle,
      meta: memberQnDataById.get(memberId.toString())?.metadata,
      membership,
    }))
  }

  // TODO: Try to avoid fetching members "one-by-one" whenever possible
  async memberDetails(memberId: MemberId, membership: Membership): Promise<MemberDetails> {
    const [memberDetails] = await this.membersDetails([[memberId, membership]])
    return memberDetails
  }

  async memberDetailsById(memberId: MemberId | number): Promise<MemberDetails | null> {
    const membership = await this._api.query.members.membershipById(memberId)
    return membership.isEmpty ? null : await this.memberDetails(createType('MemberId', memberId), membership)
  }

  async expectedMemberDetailsById(memberId: MemberId | number): Promise<MemberDetails> {
    const member = await this.memberDetailsById(memberId)
    if (!member) {
      throw new CLIError(`Expected member was not found by id: ${memberId.toString()}`)
    }

    return member
  }

  async getMembers(ids: MemberId[] | number[]): Promise<Membership[]> {
    return this._api.query.members.membershipById.multi(ids)
  }

  async membersDetailsByIds(ids: MemberId[] | number[]): Promise<MemberDetails[]> {
    const memberships = await this.getMembers(ids)
    const entries: [MemberId, Membership][] = ids.map((id, i) => [createType('MemberId', id), memberships[i]])
    return this.membersDetails(entries)
  }

  async allMembersDetails(): Promise<MemberDetails[]> {
    const entries = await this.entriesByIds(this._api.query.members.membershipById)
    return this.membersDetails(entries)
  }

  async groupLead(group: WorkingGroups): Promise<GroupMember | null> {
    const optLeadId = await this.workingGroupApiQuery(group).currentLead()

    if (!optLeadId.isSome) {
      return null
    }

    const leadWorkerId = optLeadId.unwrap()
    const leadWorker = await this.workerByWorkerId(group, leadWorkerId.toNumber())

    return await this.parseGroupMember(group, leadWorkerId, leadWorker)
  }

  protected async fetchStake(account: AccountId | string, group: WorkingGroups): Promise<Balance> {
    const groupLockId = this._api.consts[apiModuleByGroup[group]].stakingHandlerLockId
    return this._api.createType(
      'Balance',
      new BN((await this._api.query.balances.locks(account)).find((lock) => lock.id.eq(groupLockId))?.amount || 0)
    )
  }

  protected async parseGroupMember(group: WorkingGroups, id: WorkerId, worker: Worker): Promise<GroupMember> {
    const roleAccount = worker.role_account_id
    const stakingAccount = worker.staking_account_id
    const memberId = worker.member_id

    const profile = await this.expectedMemberDetailsById(memberId)

    const stake = await this.fetchStake(worker.staking_account_id, group)

    const reward: Reward = {
      valuePerBlock: worker.reward_per_block.unwrapOr(undefined),
      totalMissed: worker.missed_reward.unwrapOr(undefined),
    }

    return {
      workerId: id,
      roleAccount,
      stakingAccount,
      memberId,
      profile,
      stake,
      reward,
    }
  }

  async workerByWorkerId(group: WorkingGroups, workerId: number): Promise<Worker> {
    const nextId = await this.workingGroupApiQuery(group).nextWorkerId()

    // This is chain specfic, but if next id is still 0, it means no workers have been added yet
    if (workerId < 0 || workerId >= nextId.toNumber()) {
      throw new CLIError('Invalid worker id!')
    }

    const worker = await this.workingGroupApiQuery(group).workerById(workerId)

    if (worker.isEmpty) {
      throw new CLIError('This worker is not active anymore')
    }

    return worker
  }

  async groupMember(group: WorkingGroups, workerId: number): Promise<GroupMember> {
    const worker = await this.workerByWorkerId(group, workerId)
    return await this.parseGroupMember(group, this._api.createType('WorkerId', workerId), worker)
  }

  async groupMembers(group: WorkingGroups): Promise<GroupMember[]> {
    const workerEntries = await this.groupWorkers(group)

    const groupMembers: GroupMember[] = await Promise.all(
      workerEntries.map(([id, worker]) => this.parseGroupMember(group, id, worker))
    )

    return groupMembers.reverse() // Sort by newest
  }

  groupWorkers(group: WorkingGroups): Promise<[WorkerId, Worker][]> {
    return this.entriesByIds(this.workingGroupApiQuery(group).workerById)
  }

  async openingsByGroup(group: WorkingGroups): Promise<OpeningDetails[]> {
    const openings = await this.entriesByIds<OpeningId, Opening>(this.workingGroupApiQuery(group).openingById)

    return Promise.all(openings.map(([id, opening]) => this.fetchOpeningDetails(group, opening, id.toNumber())))
  }

  async applicationById(group: WorkingGroups, applicationId: number): Promise<Application> {
    const nextAppId = await this.workingGroupApiQuery(group).nextApplicationId<ApplicationId>()

    if (applicationId < 0 || applicationId >= nextAppId.toNumber()) {
      throw new CLIError('Invalid working group application ID!')
    }

    const result = await this.workingGroupApiQuery(group).applicationById(applicationId)

    if (result.isEmpty) {
      throw new CLIError(`Application of ID=${applicationId} no longer exists!`)
    }

    return result
  }

  protected async fetchApplicationDetails(
    group: WorkingGroups,
    applicationId: number,
    application: Application
  ): Promise<ApplicationDetails> {
    const qnData = await this._qnApi?.applicationDetailsById(group, applicationId)
    return {
      applicationId,
      member: await this.expectedMemberDetailsById(application.member_id),
      roleAccout: application.role_account_id,
      rewardAccount: application.reward_account_id,
      stakingAccount: application.staking_account_id,
      descriptionHash: application.description_hash.toString(),
      openingId: application.opening_id.toNumber(),
      answers: qnData?.answers,
    }
  }

  async groupApplication(group: WorkingGroups, applicationId: number): Promise<ApplicationDetails> {
    const application = await this.applicationById(group, applicationId)
    return await this.fetchApplicationDetails(group, applicationId, application)
  }

  protected async groupOpeningApplications(group: WorkingGroups, openingId: number): Promise<ApplicationDetails[]> {
    const applicationEntries = await this.entriesByIds<ApplicationId, Application>(
      this.workingGroupApiQuery(group).applicationById
    )

    return Promise.all(
      applicationEntries
        .filter(([, application]) => application.opening_id.eqn(openingId))
        .map(([id, application]) => this.fetchApplicationDetails(group, id.toNumber(), application))
    )
  }

  async fetchOpening(group: WorkingGroups, openingId: number): Promise<Opening> {
    const nextId = (await this.workingGroupApiQuery(group).nextOpeningId()).toNumber()

    if (openingId < 0 || openingId >= nextId) {
      throw new CLIError('Invalid working group opening ID!')
    }

    const opening = await this.workingGroupApiQuery(group).openingById(openingId)

    if (opening.isEmpty) {
      throw new CLIError(`Opening of ID=${openingId} no longer exists!`)
    }

    return opening
  }

  async fetchOpeningDetails(group: WorkingGroups, opening: Opening, openingId: number): Promise<OpeningDetails> {
    const qnData = await this._qnApi?.openingDetailsById(group, openingId)
    const applications = await this.groupOpeningApplications(group, openingId)
    const type = opening.opening_type
    const stake = {
      unstakingPeriod: opening.stake_policy.leaving_unstaking_period.toNumber(),
      value: opening.stake_policy.stake_amount,
    }

    return {
      openingId,
      applications,
      type,
      stake,
      createdAtBlock: opening.created.toNumber(),
      rewardPerBlock: opening.reward_per_block.unwrapOr(undefined),
      metadata: qnData?.metadata || undefined,
    }
  }

  async groupOpening(group: WorkingGroups, openingId: number): Promise<OpeningDetails> {
    const opening = await this.fetchOpening(group, openingId)
    return this.fetchOpeningDetails(group, opening, openingId)
  }

  async allMembers(): Promise<[MemberId, Membership][]> {
    return this.entriesByIds<MemberId, Membership>(this._api.query.members.membershipById)
  }

  // Content directory
  async availableChannels(): Promise<[ChannelId, Channel][]> {
    return await this.entriesByIds(this._api.query.content.channelById)
  }

  async availableVideos(): Promise<[VideoId, Video][]> {
    return await this.entriesByIds(this._api.query.content.videoById)
  }

  availableCuratorGroups(): Promise<[CuratorGroupId, CuratorGroup][]> {
    return this.entriesByIds(this._api.query.content.curatorGroupById)
  }

  async curatorGroupById(id: number): Promise<CuratorGroup | null> {
    const exists = !!(await this._api.query.content.curatorGroupById.size(id)).toNumber()
    return exists ? await this._api.query.content.curatorGroupById(id) : null
  }

  async nextCuratorGroupId(): Promise<number> {
    return (await this._api.query.content.nextCuratorGroupId()).toNumber()
  }

  async channelById(channelId: ChannelId | number | string): Promise<Channel> {
    // isEmpty will not work for { MemmberId: 0 } ownership
    const exists = !!(await this._api.query.content.channelById.size(channelId)).toNumber()
    if (!exists) {
      throw new CLIError(`Channel by id ${channelId.toString()} not found!`)
    }
    const channel = await this._api.query.content.channelById(channelId)

    return channel
  }

  async videoById(videoId: VideoId | number | string): Promise<Video> {
    const video = await this._api.query.content.videoById(videoId)
    if (video.isEmpty) {
      throw new CLIError(`Video by id ${videoId.toString()} not found!`)
    }

    return video
  }

  async dataObjectsByIds(bagId: BagId, ids: DataObjectId[]): Promise<DataObject[]> {
    return this._api.query.storage.dataObjectsById.multi(ids.map((id) => [bagId, id]))
  }

  async channelCategoryIds(): Promise<ChannelCategoryId[]> {
    // There is currently no way to differentiate between unexisting and existing category
    // other than fetching all existing category ids (event the .size() trick does not work, as the object is empty)
    return (await this.entriesByIds(this._api.query.content.channelCategoryById)).map(([id]) => id)
  }

  async videoCategoryIds(): Promise<VideoCategoryId[]> {
    // There is currently no way to differentiate between unexisting and existing category
    // other than fetching all existing category ids (event the .size() trick does not work, as the object is empty)
    return (await this.entriesByIds(this._api.query.content.videoCategoryById)).map(([id]) => id)
  }

  async dataObjectsInBag(bagId: BagId): Promise<[DataObjectId, DataObject][]> {
    return (await this._api.query.storage.dataObjectsById.entries(bagId)).map(([{ args: [, dataObjectId] }, value]) => [
      dataObjectId,
      value,
    ])
  }

  async stakingAccountStatus(account: string): Promise<StakingAccountMemberBinding | null> {
    const status = await this._api.query.members.stakingAccountIdMemberStatus(account)
    return status.isEmpty ? null : status
  }

  async isHandleTaken(handle: string): Promise<boolean> {
    const handleHash = blake2AsHex(handle)
    const existingMeber = await this._api.query.members.memberIdByHandleHash(handleHash)
    return !existingMeber.isEmpty
  }

  allowedLockCombinations(): { [lockId: string]: LockIdentifier[] } {
    // TODO: Fetch from runtime once exposed
    const invitedMemberLockId = this._api.consts.members.invitedMemberLockId
    const candidacyLockId = this._api.consts.council.candidacyLockId
    const votingLockId = this._api.consts.referendum.stakingHandlerLockId
    const councilorLockId = this._api.consts.council.councilorLockId
    const stakingCandidateLockId = this._api.consts.members.stakingCandidateLockId
    const proposalsLockId = this._api.consts.proposalsEngine.stakingHandlerLockId
    const groupLockIds: { group: WorkingGroups; lockId: LockIdentifier }[] = AvailableGroups.map((group) => ({
      group,
      lockId: this._api.consts[apiModuleByGroup[group]].stakingHandlerLockId,
    }))
    const bountyLockId = this._api.consts.bounty.bountyLockId

    const lockCombinationsByWorkingGroupLockId: { [groupLockId: string]: LockIdentifier[] } = {}
    groupLockIds.forEach(
      ({ lockId }) =>
        (lockCombinationsByWorkingGroupLockId[lockId.toString()] = [
          invitedMemberLockId,
          votingLockId,
          stakingCandidateLockId,
        ])
    )

    return {
      [invitedMemberLockId.toString()]: [
        votingLockId,
        candidacyLockId,
        councilorLockId,
        // STAKING_LOCK_ID,
        proposalsLockId,
        stakingCandidateLockId,
        ...groupLockIds.map(({ lockId }) => lockId),
      ],
      [stakingCandidateLockId.toString()]: [
        votingLockId,
        candidacyLockId,
        councilorLockId,
        // STAKING_LOCK_ID,
        proposalsLockId,
        invitedMemberLockId,
        ...groupLockIds.map(({ lockId }) => lockId),
      ],
      [votingLockId.toString()]: [
        invitedMemberLockId,
        candidacyLockId,
        councilorLockId,
        // STAKING_LOCK_ID,
        proposalsLockId,
        stakingCandidateLockId,
        ...groupLockIds.map(({ lockId }) => lockId),
      ],
      [candidacyLockId.toString()]: [invitedMemberLockId, votingLockId, councilorLockId, stakingCandidateLockId],
      [councilorLockId.toString()]: [invitedMemberLockId, votingLockId, candidacyLockId, stakingCandidateLockId],
      [proposalsLockId.toString()]: [invitedMemberLockId, votingLockId, stakingCandidateLockId],
      ...lockCombinationsByWorkingGroupLockId,
      [bountyLockId.toString()]: [votingLockId, stakingCandidateLockId],
    }
  }

  async areAccountLocksCompatibleWith(account: AccountId | string, lockId: LockIdentifier): Promise<boolean> {
    const accountLocks = await this._api.query.balances.locks(account)
    const allowedLocks = this.allowedLockCombinations()[lockId.toString()]
    return accountLocks.every((l) => allowedLocks.some((allowedLock) => allowedLock.eq(l.id)))
  }
}
