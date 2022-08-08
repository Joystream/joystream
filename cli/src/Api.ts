import { createType, AsCodec } from '@joystream/types'
import {
  ApplicationId,
  ChannelId,
  CuratorGroupId,
  DataObjectId,
  ForumCategoryId as CategoryId,
  ForumPostId as PostId,
  ForumThreadId as ThreadId,
  MemberId,
  VideoId,
  WorkerId,
} from '@joystream/types/primitives'
import { CLIError } from '@oclif/errors'
import { ApiPromise, WsProvider } from '@polkadot/api'
import { DeriveBalancesAll } from '@polkadot/api-derive/types'
import { AugmentedQuery, SubmittableExtrinsic } from '@polkadot/api/types'
import { KeyringPair } from '@polkadot/keyring/types'
import { Option, UInt, u64 } from '@polkadot/types'
import { Balance, AccountId, LockIdentifier, StakingLedger } from '@polkadot/types/interfaces'
import {
  PalletContentChannelRecord as Channel,
  PalletContentPermissionsCuratorGroup as CuratorGroup,
  PalletContentVideoRecord as Video,
  PalletForumCategory as Category,
  PalletForumPost as Post,
  PalletForumThread as Thread,
  PalletMembershipMembershipObject as Membership,
  PalletMembershipStakingAccountMemberBinding as StakingAccountMemberBinding,
  PalletStorageBagIdType as BagId,
  PalletStorageDataObject as DataObject,
  PalletWorkingGroupGroupWorker as Worker,
  PalletWorkingGroupJobApplication as Application,
  PalletWorkingGroupOpening as Opening,
} from '@polkadot/types/lookup'
import { Codec, Observable } from '@polkadot/types/types'
import { formatBalance } from '@polkadot/util'
import { blake2AsHex } from '@polkadot/util-crypto'
import BN from 'bn.js'
import chalk from 'chalk'
import _ from 'lodash'
import { MembershipFieldsFragment } from './graphql/generated/queries'
import QueryNodeApi from './QueryNodeApi'
import {
  AccountSummary,
  ApplicationDetails,
  GroupMember,
  MemberDetails,
  OpeningDetails,
  Reward,
  UnaugmentedApiPromise,
  WorkingGroups,
} from './Types'

export const DEFAULT_API_URI = 'ws://localhost:9944/'

// Mapping of working group to api module
export const apiModuleByGroup = {
  [WorkingGroups.StorageProviders]: 'storageWorkingGroup',
  [WorkingGroups.Curators]: 'contentWorkingGroup',
  [WorkingGroups.Forum]: 'forumWorkingGroup',
  [WorkingGroups.Membership]: 'membershipWorkingGroup',
  [WorkingGroups.Gateway]: 'gatewayWorkingGroup',
  [WorkingGroups.Builders]: 'operationsWorkingGroupAlpha',
  [WorkingGroups.HumanResources]: 'operationsWorkingGroupBeta',
  [WorkingGroups.Marketing]: 'operationsWorkingGroupGamma',
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
    return this._api as unknown as UnaugmentedApiPromise
  }

  private static async initApi(apiUri: string = DEFAULT_API_URI, metadataCache: Record<string, any>) {
    const wsProvider: WsProvider = new WsProvider(apiUri)
    const api = new ApiPromise({ provider: wsProvider, metadata: metadataCache })
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
  ): Promise<[IDType, AsCodec<ValueType>][]> {
    const entries: [IDType, AsCodec<ValueType>][] = (await apiMethod.entries()).map(([storageKey, value]) => [
      storageKey.args[0] as IDType,
      value,
    ])

    return entries.sort((a, b) => a[0].toNumber() - b[0].toNumber())
  }

  async entriesByAccountIds<AccountType extends AccountId, ValueType extends Codec>(
    apiMethod: AugmentedQuery<'promise', (key: AccountType) => Observable<ValueType>, [AccountType]>
  ): Promise<[AccountType, AsCodec<ValueType>][]> {
    const entries: [AccountType, AsCodec<ValueType>][] = (await apiMethod.entries()).map(([storageKey, value]) => [
      storageKey.args[0] as AccountType,
      value,
    ])

    return entries
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
    const membersQnData: MembershipFieldsFragment[] | undefined = await this._qnApi?.membersByIds(
      entries.map(([id]) => id)
    )
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
    const membership = (await this._api.query.members.membershipById(memberId)).unwrap()
    return membership.isEmpty ? null : await this.memberDetails(createType('u64', memberId), membership)
  }

  async expectedMemberDetailsById(memberId: MemberId | number): Promise<MemberDetails> {
    const member = await this.memberDetailsById(memberId)
    if (!member) {
      throw new CLIError(`Expected member was not found by id: ${memberId.toString()}`)
    }

    return member
  }

  async getMembers(ids: MemberId[] | number[]): Promise<Membership[]> {
    return (await this._api.query.members.membershipById.multi(ids)).map((optionalMember) => optionalMember.unwrap())
  }

  async membersDetailsByIds(ids: MemberId[] | number[]): Promise<MemberDetails[]> {
    const memberships = await this.getMembers(ids)
    const entries: [MemberId, Membership][] = ids.map((id, i) => [createType('u64', id), memberships[i]])
    return this.membersDetails(entries)
  }

  async allMembersDetails(): Promise<MemberDetails[]> {
    const entries: [u64, Membership][] = (await this.entriesByIds(this._api.query.members.membershipById)).map(
      ([id, m]) => [id, m.unwrap()]
    )
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
    return this._api.createType<Balance>(
      'Balance',
      new BN((await this._api.query.balances.locks(account)).find((lock) => lock.id.eq(groupLockId))?.amount || 0)
    )
  }

  protected async parseGroupMember(group: WorkingGroups, id: WorkerId, worker: Worker): Promise<GroupMember> {
    const roleAccount = worker.roleAccountId
    const stakingAccount = worker.stakingAccountId
    const memberId = worker.memberId

    const profile = await this.expectedMemberDetailsById(memberId)

    const stake = await this.fetchStake(worker.stakingAccountId, group)

    const reward: Reward = {
      valuePerBlock: worker.rewardPerBlock.unwrapOr(undefined),
      totalMissed: worker.missedReward.unwrapOr(undefined),
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

  async workerByWorkerId(group: WorkingGroups, workerId: WorkerId | number): Promise<Worker> {
    const worker = (await this.workingGroupApiQuery(group).workerById(workerId)).unwrap()

    if (worker.isEmpty) {
      throw new CLIError(`Worker ${chalk.magentaBright(workerId)} does not exist!`)
    }

    return worker
  }

  async groupMember(group: WorkingGroups, workerId: number): Promise<GroupMember> {
    const worker = await this.workerByWorkerId(group, workerId)
    return await this.parseGroupMember(group, createType('u64', workerId), worker)
  }

  async groupMembers(group: WorkingGroups): Promise<GroupMember[]> {
    const workerEntries = await this.groupWorkers(group)

    const groupMembers: GroupMember[] = await Promise.all(
      workerEntries.map(([id, worker]) => this.parseGroupMember(group, id, worker))
    )

    return groupMembers.reverse() // Sort by newest
  }

  async groupWorkers(group: WorkingGroups): Promise<[WorkerId, Worker][]> {
    return (await this.entriesByIds(this.workingGroupApiQuery(group).workerById)).map(([id, w]) => [id, w.unwrap()])
  }

  async openingsByGroup(group: WorkingGroups): Promise<OpeningDetails[]> {
    const openings = await this.entriesByIds(this.workingGroupApiQuery(group).openingById)

    return Promise.all(openings.map(([id, opening]) => this.fetchOpeningDetails(group, opening, id.toNumber())))
  }

  async applicationById(group: WorkingGroups, applicationId: number): Promise<Application> {
    const nextAppId = await this.workingGroupApiQuery(group).nextApplicationId<ApplicationId>()

    if (applicationId < 0 || applicationId >= nextAppId.toNumber()) {
      throw new CLIError('Invalid working group application ID!')
    }

    const result = (await this.workingGroupApiQuery(group).applicationById(applicationId)).unwrap()

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
      member: await this.expectedMemberDetailsById(application.memberId),
      roleAccount: application.roleAccountId,
      rewardAccount: application.rewardAccountId,
      stakingAccount: application.stakingAccountId,
      descriptionHash: application.descriptionHash.toString(),
      openingId: application.openingId.toNumber(),
      answers: qnData?.answers,
    }
  }

  async groupApplication(group: WorkingGroups, applicationId: number): Promise<ApplicationDetails> {
    const application = await this.applicationById(group, applicationId)
    return await this.fetchApplicationDetails(group, applicationId, application)
  }

  protected async groupOpeningApplications(group: WorkingGroups, openingId: number): Promise<ApplicationDetails[]> {
    const applicationEntries = await this.entriesByIds(this.workingGroupApiQuery(group).applicationById)

    return Promise.all(
      applicationEntries
        .filter(([, application]) => application.unwrap().openingId.eqn(openingId))
        .map(([id, application]) => this.fetchApplicationDetails(group, id.toNumber(), application.unwrap()))
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
    const type = opening.openingType
    const stake = {
      unstakingPeriod: opening.stakePolicy.leavingUnstakingPeriod.toNumber(),
      value: opening.stakePolicy.stakeAmount,
    }

    return {
      openingId,
      applications,
      type,
      stake,
      createdAtBlock: opening.created.toNumber(),
      rewardPerBlock: opening.rewardPerBlock.unwrapOr(undefined),
      metadata: qnData?.metadata || undefined,
    }
  }

  async groupOpening(group: WorkingGroups, openingId: number): Promise<OpeningDetails> {
    const opening = await this.fetchOpening(group, openingId)
    return this.fetchOpeningDetails(group, opening, openingId)
  }

  async allMembers(): Promise<[MemberId, Membership][]> {
    return (await this.entriesByIds(this._api.query.members.membershipById)).map(([id, m]) => [id, m.unwrap()])
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

  async allStakingLedgers(): Promise<[AccountId, Option<StakingLedger>][]> {
    return await this.entriesByAccountIds(this._api.query.staking.ledger)
  }

  async getStakingLedger(account: string): Promise<Option<StakingLedger>> {
    return await this._api.query.staking.ledger(account)
  }

  // async getEraElectionStatus(): Promise<ElectionStatus> {
  //   return await this._api.consts.staking.eraElectionStatus()
  // }

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

  async videoStateBloatBond(): Promise<BN> {
    return await this._api.query.content.videoStateBloatBondValue()
  }

  async channelStateBloatBond(): Promise<BN> {
    return await this._api.query.content.channelStateBloatBondValue()
  }

  async dataObjectStateBloatBond(): Promise<BN> {
    return await this._api.query.storage.dataObjectStateBloatBondValue()
  }

  async dataObjectsByIds(bagId: BagId, ids: DataObjectId[]): Promise<DataObject[]> {
    return this._api.query.storage.dataObjectsById.multi(ids.map((id) => [bagId, id]))
  }

  async selectStorageBucketsForNewChannel(): Promise<number[]> {
    const storageBuckets = await this._qnApi?.storageBucketsForNewChannel()
    const { numberOfStorageBuckets: storageBucketsPolicy } = await this._api.query.storage.dynamicBagCreationPolicies(
      'Channel'
    )

    if (!storageBuckets || storageBuckets.length < storageBucketsPolicy.toNumber()) {
      throw new CLIError(`Storage buckets policy constraint unsatisfied. Not enough storage buckets exist`)
    }

    return storageBuckets.map((b) => Number(b.id)).slice(0, storageBucketsPolicy.toNumber())
  }

  async selectDistributionBucketsForNewChannel(): Promise<
    { distributionBucketFamilyId: number; distributionBucketIndex: number }[]
  > {
    const { families: distributionBucketFamiliesPolicy } = await this._api.query.storage.dynamicBagCreationPolicies(
      'Channel'
    )

    const families = await this._qnApi?.distributionBucketsForNewChannel()
    const distributionBucketIds = []

    for (const { id, buckets } of families || []) {
      const bucketsCountPolicy = [...distributionBucketFamiliesPolicy]
        .find(([familyId]) => familyId.toString() === id)?.[1]
        .toNumber()
      if (bucketsCountPolicy && bucketsCountPolicy < buckets.length) {
        throw new CLIError(
          `Distribution buckets policy constraint unsatisfied. Not enough buckets exist in Bucket Family ${id}`
        )
      }

      distributionBucketIds.push(
        ..._.sampleSize(buckets, bucketsCountPolicy).map(({ bucketIndex }) => {
          return {
            distributionBucketFamilyId: Number(id),
            distributionBucketIndex: bucketIndex,
          }
        })
      )
    }
    return distributionBucketIds
  }

  async dataObjectsInBag(bagId: BagId): Promise<[DataObjectId, DataObject][]> {
    return (await this._api.query.storage.dataObjectsById.entries(bagId)).map(
      ([
        {
          args: [, dataObjectId],
        },
        value,
      ]) => [dataObjectId, value]
    )
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

  nonRivalrousLocks(): LockIdentifier[] {
    const votingLockId = this._api.consts.referendum.stakingHandlerLockId
    const boundStakingAccountLockId = this._api.consts.members.stakingCandidateLockId
    const invitedMemberLockId = this._api.consts.members.invitedMemberLockId
    const vestigLockId = createType('LockIdentifier', 'vesting ') as LockIdentifier

    return [votingLockId, boundStakingAccountLockId, invitedMemberLockId, vestigLockId]
  }

  isLockRivalrous(lockId: LockIdentifier): boolean {
    const nonRivalrousLocks = this.nonRivalrousLocks()
    return !nonRivalrousLocks.some((nonRivalrousLockId) => nonRivalrousLockId.eq(lockId))
  }

  async areAccountLocksCompatibleWith(account: AccountId | string, lockId: LockIdentifier): Promise<boolean> {
    const accountLocks = await this._api.query.balances.locks(account)
    const accountHasRivalrousLock = accountLocks.some(({ id }) => this.isLockRivalrous(id))

    return !this.isLockRivalrous(lockId) || !accountHasRivalrousLock
  }

  async forumCategoryExists(categoryId: CategoryId | number): Promise<boolean> {
    const size = await this._api.query.forum.categoryById.size(categoryId)
    return size.gtn(0)
  }

  async forumThreadExists(categoryId: CategoryId | number, threadId: ThreadId | number): Promise<boolean> {
    const size = await this._api.query.forum.threadById.size(categoryId, threadId)
    return size.gtn(0)
  }

  async forumPostExists(threadId: ThreadId | number, postId: PostId | number): Promise<boolean> {
    const size = await this._api.query.forum.postById.size(threadId, postId)
    return size.gtn(0)
  }

  async forumCategoryAncestors(categoryId: CategoryId | number): Promise<[CategoryId, Category][]> {
    const ancestors: [CategoryId, Category][] = []
    let category = await this._api.query.forum.categoryById(categoryId)
    while (category.parentCategoryId.isSome) {
      const parentCategoryId = category.parentCategoryId.unwrap()
      category = await this._api.query.forum.categoryById(parentCategoryId)
      ancestors.push([parentCategoryId, category])
    }
    return ancestors
  }

  async forumCategoryModerators(categoryId: CategoryId | number): Promise<[CategoryId, WorkerId][]> {
    const categoryAncestors = await this.forumCategoryAncestors(categoryId)

    const moderatorIds = _.uniqWith(
      _.flatten(
        await Promise.all(
          categoryAncestors
            .map(([id]) => id as CategoryId | number)
            .reverse()
            .concat([categoryId])
            .map(async (id) => {
              const storageKeys = await this._api.query.forum.categoryByModerator.keys(id)
              return storageKeys.map((k) => k.args)
            })
        )
      ),
      (a, b) => a[1].eq(b[1])
    )

    return moderatorIds
  }

  async getForumCategory(categoryId: CategoryId | number): Promise<Category> {
    const category = await this._api.query.forum.categoryById(categoryId)
    return category
  }

  async getForumThread(categoryId: CategoryId | number, threadId: ThreadId | number): Promise<Thread> {
    const thread = await this._api.query.forum.threadById(categoryId, threadId)
    return thread
  }

  async getForumPost(threadId: ThreadId | number, postId: PostId | number): Promise<Post> {
    const post = await this._api.query.forum.postById(threadId, postId)
    return post
  }

  async forumCategories(): Promise<[CategoryId, Category][]> {
    return this.entriesByIds(this._api.query.forum.categoryById)
  }

  async forumThreads(categoryId: CategoryId | number): Promise<[ThreadId, Thread][]> {
    const entries = await this._api.query.forum.threadById.entries(categoryId)
    return entries.map(([storageKey, thread]) => [storageKey.args[1], thread])
  }

  async forumPosts(threadId: ThreadId | number): Promise<[PostId, Post][]> {
    const entries = await this._api.query.forum.postById.entries(threadId)
    return entries.map(([storageKey, thread]) => [storageKey.args[1], thread])
  }
}
