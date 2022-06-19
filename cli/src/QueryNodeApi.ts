import { StorageNodeInfo, WorkingGroups } from './Types'
import {
  ApolloClient,
  InMemoryCache,
  HttpLink,
  NormalizedCacheObject,
  DocumentNode,
  from,
  ApolloLink,
} from '@apollo/client/core'
import { ErrorLink, onError } from '@apollo/client/link/error'
import { Maybe, Scalars } from './graphql/generated/schema'
import {
  GetStorageNodesInfoByBagId,
  GetStorageNodesInfoByBagIdQuery,
  GetStorageNodesInfoByBagIdQueryVariables,
  DataObjectInfoFragment,
  GetDataObjectsByBagId,
  GetDataObjectsByBagIdQuery,
  GetDataObjectsByBagIdQueryVariables,
  GetDataObjectsByVideoId,
  GetDataObjectsByVideoIdQuery,
  GetDataObjectsByVideoIdQueryVariables,
  GetDataObjectsByChannelId,
  GetDataObjectsByChannelIdQuery,
  GetDataObjectsByChannelIdQueryVariables,
  GetMembersByIds,
  GetMembersByIdsQuery,
  GetMembersByIdsQueryVariables,
  MembershipFieldsFragment,
  WorkingGroupOpeningDetailsFragment,
  OpeningDetailsByIdQuery,
  OpeningDetailsByIdQueryVariables,
  OpeningDetailsById,
  WorkingGroupApplicationDetailsFragment,
  ApplicationDetailsByIdQuery,
  ApplicationDetailsByIdQueryVariables,
  ApplicationDetailsById,
  UpcomingWorkingGroupOpeningByEventQuery,
  UpcomingWorkingGroupOpeningByEventQueryVariables,
  UpcomingWorkingGroupOpeningByEvent,
  UpcomingWorkingGroupOpeningDetailsFragment,
  UpcomingWorkingGroupOpeningByIdQuery,
  UpcomingWorkingGroupOpeningByIdQueryVariables,
  UpcomingWorkingGroupOpeningById,
  UpcomingWorkingGroupOpeningsByGroupQuery,
  UpcomingWorkingGroupOpeningsByGroupQueryVariables,
  UpcomingWorkingGroupOpeningsByGroup,

  BudgetUpdatedEventFieldsFragment,
  BudgetUpdatedEventsBetweenDatesQuery,
  BudgetUpdatedEventsBetweenDatesQueryVariables,
  BudgetUpdatedEventsBetweenDates,
  
  BudgetUpdatedEventsBetweenBlocksQuery,
  BudgetUpdatedEventsBetweenBlocksQueryVariables,
  BudgetUpdatedEventsBetweenBlocks,
  
  BudgetRefillEventFieldsFragment,
  BudgetRefillEventsBetweenBlocksQuery,
  BudgetRefillEventsBetweenBlocksQueryVariables,
  BudgetRefillEventsBetweenBlocks,

  RewardPaidEventFieldsFragment,
  RewardPaidEventsBetweenBlocksQuery,
  RewardPaidEventsBetweenBlocksQueryVariables,
  RewardPaidEventsBetweenBlocks,

  ProposalExecutedEventFieldsFragment,
  ProposalExecutedEventsBetweenBlocksQuery,
  ProposalExecutedEventsBetweenBlocksQueryVariables,
  ProposalExecutedEventsBetweenBlocks,

  CouncilMembersRewardFieldsFragment,
  CouncilMembersAtBlockQuery,
  CouncilMembersAtBlockQueryVariables,
  CouncilMembersAtBlock,

  AllWorkerHistoryFieldsFragment,
  AllWorkerHistoryQuery,
  AllWorkerHistoryQueryVariables,
  AllWorkerHistory,

  ProposalsDecisionMadeEventsFieldsFragment,
  ProposalsDecisionMadeEventsBetweenBlocksQuery,
  ProposalsDecisionMadeEventsBetweenBlocksQueryVariables,
  ProposalsDecisionMadeEventsBetweenBlocks,

  MemberInvitedEventsFieldsFragment,
  MemberInvitedEventsBetweenBlocksQuery,
  MemberInvitedEventsBetweenBlocksQueryVariables,
  MemberInvitedEventsBetweenBlocks,

  AllBountiesFieldsFragment,
  AllBountiesQuery,
  AllBountiesQueryVariables,
  AllBounties,

  StorageBagStorageReplicationFieldsFragment,
  StorageBagStorageReplicationQuery,
  StorageBagStorageReplicationQueryVariables,
  StorageBagStorageReplication,

  StorageBagDistributionStatusFieldsFragment,
  StorageBagDistributionStatusQuery,
  StorageBagDistributionStatusQueryVariables,
  StorageBagDistributionStatus,

  StorageBucketsDataFieldsFragment,
  StorageBucketsDataQuery,
  StorageBucketsDataQueryVariables,
  StorageBucketsData,

  OracleJudgmentSubmittedEventsBetweenBlocksFieldsFragment,
  OracleJudgmentSubmittedEventsBetweenBlocksQuery,
  OracleJudgmentSubmittedEventsBetweenBlocksQueryVariables,
  OracleJudgmentSubmittedEventsBetweenBlocks,

  BountiesCreatedBetweenBlocksFieldsFragment,
  BountiesCreatedBetweenBlocksQuery,
  BountiesCreatedBetweenBlocksQueryVariables,
  BountiesCreatedBetweenBlocks,

  BountiesFundedBetweenBlocksFieldsFragment,
  BountiesFundedBetweenBlocksQuery,
  BountiesFundedBetweenBlocksQueryVariables,
  BountiesFundedBetweenBlocks,

  MembersByControllerAccounts,
  MembersByControllerAccountsQuery,
  MembersByControllerAccountsQueryVariables,
  MembershipDataFieldsFragment,

  MembersByRootAccounts,
  MembersByRootAccountsQuery,
  MembersByRootAccountsQueryVariables,

  FailedUploadsBetweenTimestamps,
  FailedUploadsBetweenTimestampsQuery,
  FailedUploadsBetweenTimestampsQueryVariables,
  FailedUploadsBetweenTimestampsFieldsFragment,

  OpeningAddedEventsBetweenBlocks,
  OpeningAddedEventsBetweenBlocksQuery,
  OpeningAddedEventsBetweenBlocksQueryVariables,
  OpeningAddedEventsBetweenBlocksFieldsFragment,

  WorkingGroupOpenings,
  WorkingGroupOpeningsQuery,
  WorkingGroupOpeningsQueryVariables,
  WorkingGroupOpeningsFieldsFragment,

  AllForumPosts,
  AllForumPostsQuery,
  AllForumPostsQueryVariables,
  AllForumPostsFieldsFragment,

  AllForumCategories,
  AllForumCategoriesQuery,
  AllForumCategoriesQueryVariables,
  AllForumCategoriesFieldsFragment,

  AllForumThreads,
  AllForumThreadsQuery,
  AllForumThreadsQueryVariables,
  AllForumThreadsFieldsFragment,

  AllVideos,
  AllVideosQuery,
  AllVideosQueryVariables,
  AllVideosFieldsFragment,

  AllChannels,
  AllChannelsQuery,
  AllChannelsQueryVariables,
  AllChannelsFieldsFragment,

  VideosCreatedBetweenBlocks,
  VideosCreatedBetweenBlocksQuery,
  VideosCreatedBetweenBlocksQueryVariables,

  ChannelsCreatedBetweenBlocks,
  ChannelsCreatedBetweenBlocksQuery,
  ChannelsCreatedBetweenBlocksQueryVariables,

  BudgetSpendingEvent,
  BudgetSpendingEventQuery,
  BudgetSpendingEventQueryVariables,
  BudgetSpendingEventFieldsFragment,

  DistributionBucketsDataFieldsFragment,
  DistributionBucketsDataQuery,
  DistributionBucketsDataQueryVariables,
  DistributionBucketsData,

  DistributionBucketFamilyDataFieldsFragment,
  DistributionBucketFamilyDataQuery,
  DistributionBucketFamilyDataQueryVariables,
  DistributionBucketFamilyData,

  PostAddedEventsBetweenBlocksFieldsFragment,
  PostAddedEventsBetweenBlocksQuery,
  PostAddedEventsBetweenBlocksQueryVariables,
  PostAddedEventsBetweenBlocks,

  ThreadCreatedEventsBetweenBlocksFieldsFragment,
  ThreadCreatedEventsBetweenBlocksQuery,
  ThreadCreatedEventsBetweenBlocksQueryVariables,
  ThreadCreatedEventsBetweenBlocks,

  PostDeletedEventsBetweenBlocksFieldsFragment,
  PostDeletedEventsBetweenBlocksQuery,
  PostDeletedEventsBetweenBlocksQueryVariables,
  PostDeletedEventsBetweenBlocks,

  ThreadDeletedEventsBetweenBlocksFieldsFragment,
  ThreadDeletedEventsBetweenBlocksQuery,
  ThreadDeletedEventsBetweenBlocksQueryVariables,
  ThreadDeletedEventsBetweenBlocks,

  PostModeratedEventsBetweenBlocksFieldsFragment,
  PostModeratedEventsBetweenBlocksQuery,
  PostModeratedEventsBetweenBlocksQueryVariables,
  PostModeratedEventsBetweenBlocks,

  ThreadModeratedEventsBetweenBlocksFieldsFragment,
  ThreadModeratedEventsBetweenBlocksQuery,
  ThreadModeratedEventsBetweenBlocksQueryVariables,
  ThreadModeratedEventsBetweenBlocks,

  PostReactedEventsBetweenBlocksFieldsFragment,
  PostReactedEventsBetweenBlocksQuery,
  PostReactedEventsBetweenBlocksQueryVariables,
  PostReactedEventsBetweenBlocks,

  ThreadMetadataUpdatedEventsBetweenBlocksFieldsFragment,
  ThreadMetadataUpdatedEventsBetweenBlocksQuery,
  ThreadMetadataUpdatedEventsBetweenBlocksQueryVariables,
  ThreadMetadataUpdatedEventsBetweenBlocks,

  ThreadMovedEventsBetweenBlocksFieldsFragment,
  ThreadMovedEventsBetweenBlocksQuery,
  ThreadMovedEventsBetweenBlocksQueryVariables,
  ThreadMovedEventsBetweenBlocks,

  NftBoughtEventsBetweenBlocksFieldsFragment,
  NftBoughtEventsBetweenBlocksQuery,
  NftBoughtEventsBetweenBlocksQueryVariables,
  NftBoughtEventsBetweenBlocks,

  NftIssuedEventsBetweenBlocksFieldsFragment,
  NftIssuedEventsBetweenBlocksQuery,
  NftIssuedEventsBetweenBlocksQueryVariables,
  NftIssuedEventsBetweenBlocks,

} from './graphql/generated/queries'
import { URL } from 'url'
import fetch from 'cross-fetch'
import { MemberId } from '@joystream/types/common'
import { ApplicationId, OpeningId } from '@joystream/types/working-group'
import { apiModuleByGroup } from './Api'

export default class QueryNodeApi {
  private _qnClient: ApolloClient<NormalizedCacheObject>

  public constructor(uri?: string, errorHandler?: ErrorLink.ErrorHandler) {
    const links: ApolloLink[] = []
    if (errorHandler) {
      links.push(onError(errorHandler))
    }
    links.push(new HttpLink({ uri, fetch }))
    this._qnClient = new ApolloClient({
      link: from(links),
      cache: new InMemoryCache({ addTypename: false }),
      defaultOptions: { query: { fetchPolicy: 'no-cache', errorPolicy: 'all' } },
    })
  }

  // Get entity by unique input
  protected async uniqueEntityQuery<
    QueryT extends { [k: string]: Maybe<Record<string, unknown>> | undefined },
    VariablesT extends Record<string, unknown>
  >(
    query: DocumentNode,
    variables: VariablesT,
    resultKey: keyof QueryT
  ): Promise<Required<QueryT>[keyof QueryT] | null> {
    return (await this._qnClient.query<QueryT, VariablesT>({ query, variables })).data[resultKey] || null
  }

  // Get entities by "non-unique" input and return first result
  protected async firstEntityQuery<
    QueryT extends { [k: string]: unknown[] },
    VariablesT extends Record<string, unknown>
  >(query: DocumentNode, variables: VariablesT, resultKey: keyof QueryT): Promise<QueryT[keyof QueryT][number] | null> {
    return (await this._qnClient.query<QueryT, VariablesT>({ query, variables })).data[resultKey][0] || null
  }

  // Get multiple entities
  protected async multipleEntitiesQuery<
    QueryT extends { [k: string]: unknown[] },
    VariablesT extends Record<string, unknown>
  >(query: DocumentNode, variables: VariablesT, resultKey: keyof QueryT): Promise<QueryT[keyof QueryT]> {
    return (await this._qnClient.query<QueryT, VariablesT>({ query, variables })).data[resultKey]
  }

  async dataObjectsByBagId(bagId: string): Promise<DataObjectInfoFragment[]> {
    return this.multipleEntitiesQuery<GetDataObjectsByBagIdQuery, GetDataObjectsByBagIdQueryVariables>(
      GetDataObjectsByBagId,
      { bagId },
      'storageDataObjects'
    )
  }

  async dataObjectsByVideoId(videoId: string): Promise<DataObjectInfoFragment[]> {
    return this.multipleEntitiesQuery<GetDataObjectsByVideoIdQuery, GetDataObjectsByVideoIdQueryVariables>(
      GetDataObjectsByVideoId,
      { videoId },
      'storageDataObjects'
    )
  }

  async dataObjectsByChannelId(channelId: string): Promise<DataObjectInfoFragment[]> {
    return this.multipleEntitiesQuery<GetDataObjectsByChannelIdQuery, GetDataObjectsByChannelIdQueryVariables>(
      GetDataObjectsByChannelId,
      { channelId },
      'storageDataObjects'
    )
  }

  async storageNodesInfoByBagId(bagId: string): Promise<StorageNodeInfo[]> {
    const result = await this.multipleEntitiesQuery<
      GetStorageNodesInfoByBagIdQuery,
      GetStorageNodesInfoByBagIdQueryVariables
    >(GetStorageNodesInfoByBagId, { bagId }, 'storageBuckets')

    const validNodesInfo: StorageNodeInfo[] = []
    for (const { operatorMetadata, id } of result) {
      if (operatorMetadata?.nodeEndpoint) {
        try {
          const rootEndpoint = operatorMetadata.nodeEndpoint
          const apiEndpoint = new URL(
            'api/v1',
            rootEndpoint.endsWith('/') ? rootEndpoint : rootEndpoint + '/'
          ).toString()
          validNodesInfo.push({
            apiEndpoint,
            bucketId: parseInt(id),
          })
        } catch (e) {
          continue
        }
      }
    }
    return validNodesInfo
  }

  async membersByIds(ids: MemberId[] | string[]): Promise<MembershipFieldsFragment[]> {
    return this.multipleEntitiesQuery<GetMembersByIdsQuery, GetMembersByIdsQueryVariables>(
      GetMembersByIds,
      {
        ids: ids.map((id) => id.toString()),
      },
      'memberships'
    )
  }

  async openingDetailsById(
    group: WorkingGroups,
    id: OpeningId | number
  ): Promise<WorkingGroupOpeningDetailsFragment | null> {
    return this.uniqueEntityQuery<OpeningDetailsByIdQuery, OpeningDetailsByIdQueryVariables>(
      OpeningDetailsById,
      { id: `${apiModuleByGroup[group]}-${id.toString()}` },
      'workingGroupOpeningByUniqueInput'
    )
  }

  async applicationDetailsById(
    group: WorkingGroups,
    id: ApplicationId | number
  ): Promise<WorkingGroupApplicationDetailsFragment | null> {
    return this.uniqueEntityQuery<ApplicationDetailsByIdQuery, ApplicationDetailsByIdQueryVariables>(
      ApplicationDetailsById,
      { id: `${apiModuleByGroup[group]}-${id.toString()}` },
      'workingGroupApplicationByUniqueInput'
    )
  }

  async upcomingWorkingGroupOpeningByEvent(
    blockNumber: number,
    indexInBlock: number
  ): Promise<UpcomingWorkingGroupOpeningDetailsFragment | null> {
    return this.firstEntityQuery<
      UpcomingWorkingGroupOpeningByEventQuery,
      UpcomingWorkingGroupOpeningByEventQueryVariables
    >(UpcomingWorkingGroupOpeningByEvent, { blockNumber, indexInBlock }, 'upcomingWorkingGroupOpenings')
  }

  async upcomingWorkingGroupOpeningById(id: string): Promise<UpcomingWorkingGroupOpeningDetailsFragment | null> {
    return this.uniqueEntityQuery<UpcomingWorkingGroupOpeningByIdQuery, UpcomingWorkingGroupOpeningByIdQueryVariables>(
      UpcomingWorkingGroupOpeningById,
      { id },
      'upcomingWorkingGroupOpeningByUniqueInput'
    )
  }

  async upcomingWorkingGroupOpeningsByGroup(
    group: WorkingGroups
  ): Promise<UpcomingWorkingGroupOpeningDetailsFragment[]> {
    return this.multipleEntitiesQuery<
      UpcomingWorkingGroupOpeningsByGroupQuery,
      UpcomingWorkingGroupOpeningsByGroupQueryVariables
    >(UpcomingWorkingGroupOpeningsByGroup, { workingGroupId: apiModuleByGroup[group] }, 'upcomingWorkingGroupOpenings')
  }

  async budgetUpdatedEventsBetweenDates(
    startDate: Date,
    endDate: Date
  ): Promise<BudgetUpdatedEventFieldsFragment[]> {
    return this.multipleEntitiesQuery<
      BudgetUpdatedEventsBetweenDatesQuery,
      BudgetUpdatedEventsBetweenDatesQueryVariables
    >(BudgetUpdatedEventsBetweenDates, { startDate, endDate }, 'budgetUpdatedEvents')
  }

  async budgetUpdatedEventsBetweenBlocks(
    startBlock: number,
    endBlock: number
  ): Promise<BudgetUpdatedEventFieldsFragment[]> {
    return this.multipleEntitiesQuery<
      BudgetUpdatedEventsBetweenBlocksQuery,
      BudgetUpdatedEventsBetweenBlocksQueryVariables
    >(BudgetUpdatedEventsBetweenBlocks, { startBlock, endBlock }, 'budgetUpdatedEvents')
  }

  async budgetRefillEventsBetweenBlocks(
    startBlock: number,
    endBlock: number
  ): Promise<BudgetRefillEventFieldsFragment[]> {
    return this.multipleEntitiesQuery<
    BudgetRefillEventsBetweenBlocksQuery,
    BudgetRefillEventsBetweenBlocksQueryVariables
    >(BudgetRefillEventsBetweenBlocks, { startBlock, endBlock }, 'budgetRefillEvents')
  }

  async rewardPaidEventsBetweenBlocks(
    startBlock: number,
    endBlock: number
  ): Promise<RewardPaidEventFieldsFragment[]> {
    return this.multipleEntitiesQuery<
    RewardPaidEventsBetweenBlocksQuery,
    RewardPaidEventsBetweenBlocksQueryVariables
    >(RewardPaidEventsBetweenBlocks, { startBlock, endBlock }, 'rewardPaidEvents')
  }

  async proposalExecutedEventsBetweenBlocks(
    startBlock: number,
    endBlock: number
  ): Promise<ProposalExecutedEventFieldsFragment[]> {
    return this.multipleEntitiesQuery<
    ProposalExecutedEventsBetweenBlocksQuery,
    ProposalExecutedEventsBetweenBlocksQueryVariables
    >(ProposalExecutedEventsBetweenBlocks, { startBlock, endBlock }, 'proposalExecutedEvents')
  }

  async councilMembersAtBlock(
    endBlock: number
  ): Promise<CouncilMembersRewardFieldsFragment[]> {
    return this.multipleEntitiesQuery<
    CouncilMembersAtBlockQuery,
    CouncilMembersAtBlockQueryVariables
    >(CouncilMembersAtBlock, { endBlock }, 'councilMembers')
  }

  async workerHistory(
  ): Promise<AllWorkerHistoryFieldsFragment[]> {
    return this.multipleEntitiesQuery<
    AllWorkerHistoryQuery,
    AllWorkerHistoryQueryVariables
    >(AllWorkerHistory, {}, 'workers')
  }

  async proposalsDecisionMadeEventsBetweenBlocks(
    startBlock: number,
    endBlock: number
  ): Promise<ProposalsDecisionMadeEventsFieldsFragment[]> {
    return this.multipleEntitiesQuery<
    ProposalsDecisionMadeEventsBetweenBlocksQuery,
    ProposalsDecisionMadeEventsBetweenBlocksQueryVariables
    >(ProposalsDecisionMadeEventsBetweenBlocks, { startBlock, endBlock }, 'proposalDecisionMadeEvents')
  }

  async memberInvitedEventsBetweenBlocks(
    startBlock: number,
    endBlock: number
  ): Promise<MemberInvitedEventsFieldsFragment[]> {
    return this.multipleEntitiesQuery<
    MemberInvitedEventsBetweenBlocksQuery,
    MemberInvitedEventsBetweenBlocksQueryVariables
    >(MemberInvitedEventsBetweenBlocks, { startBlock, endBlock }, 'memberInvitedEvents')
  }

  async allBounties(
  ): Promise<AllBountiesFieldsFragment[]> {
    return this.multipleEntitiesQuery<
    AllBountiesQuery,
    AllBountiesQueryVariables
    >(AllBounties, { }, 'bounties')
  }

  async storageBagStorageReplication(
  ): Promise<StorageBagStorageReplicationFieldsFragment[]> {
    return this.multipleEntitiesQuery<
    StorageBagStorageReplicationQuery,
    StorageBagStorageReplicationQueryVariables
    >(StorageBagStorageReplication, { }, 'storageBags')
  }

  async storageBagDistributionStatus(
  ): Promise<StorageBagDistributionStatusFieldsFragment[]> {
    return this.multipleEntitiesQuery<
    StorageBagDistributionStatusQuery,
    StorageBagDistributionStatusQueryVariables
    >(StorageBagDistributionStatus, { }, 'storageBags')
  }

  async storageBucketsData(
  ): Promise<StorageBucketsDataFieldsFragment[]> {
    return this.multipleEntitiesQuery<
    StorageBucketsDataQuery,
    StorageBucketsDataQueryVariables
    >(StorageBucketsData, { }, 'storageBuckets')
  }

  async bountiesCreatedBetweenBlocks(
    startBlock: number,
    endBlock: number
  ): Promise<BountiesCreatedBetweenBlocksFieldsFragment[]> {
    return this.multipleEntitiesQuery<
    BountiesCreatedBetweenBlocksQuery,
    BountiesCreatedBetweenBlocksQueryVariables
    >(BountiesCreatedBetweenBlocks, { startBlock, endBlock }, 'bountyCreatedEvents')
  }

  async oracleJudgmentSubmittedEventsBetweenBlocks(
    startBlock: number,
    endBlock: number
  ): Promise<OracleJudgmentSubmittedEventsBetweenBlocksFieldsFragment[]> {
    return this.multipleEntitiesQuery<
    OracleJudgmentSubmittedEventsBetweenBlocksQuery,
    OracleJudgmentSubmittedEventsBetweenBlocksQueryVariables
    >(OracleJudgmentSubmittedEventsBetweenBlocks, { startBlock, endBlock }, 'oracleJudgmentSubmittedEvents')
  }

  async bountiesFundedBetweenBlocks(
    startBlock: number,
    endBlock: number
  ): Promise<BountiesFundedBetweenBlocksFieldsFragment[]> {
    return this.multipleEntitiesQuery<
    BountiesFundedBetweenBlocksQuery,
    BountiesFundedBetweenBlocksQueryVariables
    >(BountiesFundedBetweenBlocks, { startBlock, endBlock }, 'bountyFundedEvents')
  }

  async membersByControllerAccounts(
    controllerAccounts: string[]
  ): Promise<MembershipDataFieldsFragment[]> {
    return this.multipleEntitiesQuery<
    MembersByControllerAccountsQuery,
    MembersByControllerAccountsQueryVariables
    >(MembersByControllerAccounts, { controllerAccounts }, 'memberships')
  }

  async membersByRootAccounts(
    rootAccounts: string[]
  ): Promise<MembershipDataFieldsFragment[]> {
    return this.multipleEntitiesQuery<
    MembersByRootAccountsQuery,
    MembersByRootAccountsQueryVariables
    >(MembersByRootAccounts, { rootAccounts }, 'memberships')
  }

  async failedUploadsBetweenTimestamps(
    startDate: Scalars["DateTime"],
    endDate: Scalars["DateTime"]
  ): Promise<FailedUploadsBetweenTimestampsFieldsFragment[]> {
    return this.multipleEntitiesQuery<
      FailedUploadsBetweenTimestampsQuery,
      FailedUploadsBetweenTimestampsQueryVariables
    >(FailedUploadsBetweenTimestamps, { startDate, endDate }, 'storageDataObjects')
  }

  async failedUploadsBetweenTimestamps2(
    startDate: string,
    endDate: string
  ): Promise<FailedUploadsBetweenTimestampsFieldsFragment[]> {
    return this.multipleEntitiesQuery<
      FailedUploadsBetweenTimestampsQuery,
      FailedUploadsBetweenTimestampsQueryVariables
    >(FailedUploadsBetweenTimestamps, { startDate, endDate }, 'storageDataObjects')
  }

  async getAllOpeningsInRange(
    startBlock: number,
    endBlock: number
  ): Promise<OpeningAddedEventsBetweenBlocksFieldsFragment[]> {
    return this.multipleEntitiesQuery<
      OpeningAddedEventsBetweenBlocksQuery,
      OpeningAddedEventsBetweenBlocksQueryVariables
      >(OpeningAddedEventsBetweenBlocks, { startBlock, endBlock }, 'openingAddedEvents')
  }

  async allWorkingGroupOpenings(
    ): Promise<WorkingGroupOpeningsFieldsFragment[]> {
      return this.multipleEntitiesQuery<
      WorkingGroupOpeningsQuery,
      WorkingGroupOpeningsQueryVariables
      >(WorkingGroupOpenings, { }, 'workingGroupOpenings')
  }

  async allForumPosts(
    ): Promise<AllForumPostsFieldsFragment[]> {
      return this.multipleEntitiesQuery<
      AllForumPostsQuery,
      AllForumPostsQueryVariables
      >(AllForumPosts, { }, 'forumPosts')
  }

  async allForumCategories(
    ): Promise<AllForumCategoriesFieldsFragment[]> {
      return this.multipleEntitiesQuery<
      AllForumCategoriesQuery,
      AllForumCategoriesQueryVariables
      >(AllForumCategories, { }, 'forumCategories')
  }

  async allForumThreads(
    ): Promise<AllForumThreadsFieldsFragment[]> {
      return this.multipleEntitiesQuery<
      AllForumThreadsQuery,
      AllForumThreadsQueryVariables
      >(AllForumThreads, { }, 'forumThreads')
  }

  async allVideos(
    ): Promise<AllVideosFieldsFragment[]> {
      return this.multipleEntitiesQuery<
      AllVideosQuery,
      AllVideosQueryVariables
      >(AllVideos, { }, 'videos')
  }

  async allChannels(
    ): Promise<AllChannelsFieldsFragment[]> {
      return this.multipleEntitiesQuery<
      AllChannelsQuery,
      AllChannelsQueryVariables
      >(AllChannels, { }, 'channels')
  }

  async videosCreatedBetweenBlocks(
    startBlock: number,
    endBlock: number
    ): Promise<AllVideosFieldsFragment[]> {
      return this.multipleEntitiesQuery<
      VideosCreatedBetweenBlocksQuery,
      VideosCreatedBetweenBlocksQueryVariables
      >(VideosCreatedBetweenBlocks, { startBlock, endBlock }, 'videos')
  }

  async channelsCreatedBetweenBlocks(
    startBlock: number,
    endBlock: number
    ): Promise<AllChannelsFieldsFragment[]> {
      return this.multipleEntitiesQuery<
      ChannelsCreatedBetweenBlocksQuery,
      ChannelsCreatedBetweenBlocksQueryVariables
      >(ChannelsCreatedBetweenBlocks, { startBlock, endBlock}, 'channels')
  }

  async allBudgetSpendingEvents(
    ): Promise<BudgetSpendingEventFieldsFragment[]> {
      return this.multipleEntitiesQuery<
      BudgetSpendingEventQuery,
      BudgetSpendingEventQueryVariables
      >(BudgetSpendingEvent, { }, 'budgetSpendingEvents')
  }

  async distributionBucketsData(
    ): Promise<DistributionBucketsDataFieldsFragment[]> {
      return this.multipleEntitiesQuery<
      DistributionBucketsDataQuery,
      DistributionBucketsDataQueryVariables
      >(DistributionBucketsData, { }, 'distributionBuckets')
    }

    async distributionBucketFamilyData(
    ): Promise<DistributionBucketFamilyDataFieldsFragment[]> {
      return this.multipleEntitiesQuery<
      DistributionBucketFamilyDataQuery,
      DistributionBucketFamilyDataQueryVariables
      >(DistributionBucketFamilyData, { }, 'distributionBucketFamilies')
    }

    async postAddedEventsBetweenBlocks(
      startBlock: number,
      endBlock: number
    ): Promise<PostAddedEventsBetweenBlocksFieldsFragment[]> {
      return this.multipleEntitiesQuery<
      PostAddedEventsBetweenBlocksQuery,
      PostAddedEventsBetweenBlocksQueryVariables
      >(PostAddedEventsBetweenBlocks, { startBlock, endBlock }, 'postAddedEvents')
    }


    async threadCreatedEventsBetweenBlocks(
      startBlock: number,
      endBlock: number
    ): Promise<ThreadCreatedEventsBetweenBlocksFieldsFragment[]> {
      return this.multipleEntitiesQuery<
      ThreadCreatedEventsBetweenBlocksQuery,
      ThreadCreatedEventsBetweenBlocksQueryVariables
      >(ThreadCreatedEventsBetweenBlocks, { startBlock, endBlock }, 'threadCreatedEvents')
    }

    async postDeletedEventsBetweenBlocks(
      startBlock: number,
      endBlock: number
    ): Promise<PostDeletedEventsBetweenBlocksFieldsFragment[]> {
      return this.multipleEntitiesQuery<
      PostDeletedEventsBetweenBlocksQuery,
      PostDeletedEventsBetweenBlocksQueryVariables
      >(PostDeletedEventsBetweenBlocks, { startBlock, endBlock }, 'postDeletedEvents')
    }


    async threadDeletedEventsBetweenBlocks(
      startBlock: number,
      endBlock: number
    ): Promise<ThreadDeletedEventsBetweenBlocksFieldsFragment[]> {
      return this.multipleEntitiesQuery<
      ThreadDeletedEventsBetweenBlocksQuery,
      ThreadDeletedEventsBetweenBlocksQueryVariables
      >(ThreadDeletedEventsBetweenBlocks, { startBlock, endBlock }, 'threadDeletedEvents')
    }


    async postModeratedEventsBetweenBlocks(
      startBlock: number,
      endBlock: number
    ): Promise<PostModeratedEventsBetweenBlocksFieldsFragment[]> {
      return this.multipleEntitiesQuery<
      PostModeratedEventsBetweenBlocksQuery,
      PostModeratedEventsBetweenBlocksQueryVariables
      >(PostModeratedEventsBetweenBlocks, { startBlock, endBlock }, 'postModeratedEvents')
    }

    async threadModeratedEventsBetweenBlocks(
      startBlock: number,
      endBlock: number
    ): Promise<ThreadModeratedEventsBetweenBlocksFieldsFragment[]> {
      return this.multipleEntitiesQuery<
      ThreadModeratedEventsBetweenBlocksQuery,
      ThreadModeratedEventsBetweenBlocksQueryVariables
      >(ThreadModeratedEventsBetweenBlocks, { startBlock, endBlock }, 'threadModeratedEvents')
    }
    async postReactedEventsBetweenBlocks(
      startBlock: number,
      endBlock: number
    ): Promise<PostReactedEventsBetweenBlocksFieldsFragment[]> {
      return this.multipleEntitiesQuery<
      PostReactedEventsBetweenBlocksQuery,
      PostReactedEventsBetweenBlocksQueryVariables
      >(PostReactedEventsBetweenBlocks, { startBlock, endBlock }, 'postReactedEvents')
    }

    async threadMetadataUpdatedEventsBetweenBlocks(
      startBlock: number,
      endBlock: number
    ): Promise<ThreadMetadataUpdatedEventsBetweenBlocksFieldsFragment[]> {
      return this.multipleEntitiesQuery<
      ThreadMetadataUpdatedEventsBetweenBlocksQuery,
      ThreadMetadataUpdatedEventsBetweenBlocksQueryVariables
      >(ThreadMetadataUpdatedEventsBetweenBlocks, { startBlock, endBlock }, 'threadMetadataUpdatedEvents')
    }

    async threadMovedEventsBetweenBlocks(
      startBlock: number,
      endBlock: number
    ): Promise<ThreadMovedEventsBetweenBlocksFieldsFragment[]> {
      return this.multipleEntitiesQuery<
      ThreadMovedEventsBetweenBlocksQuery,
      ThreadMovedEventsBetweenBlocksQueryVariables
      >(ThreadMovedEventsBetweenBlocks, { startBlock, endBlock }, 'threadMovedEvents')
    }
    async nftIssuedEventsBetweenBlocks(
      startBlock: number,
      endBlock: number
    ): Promise<NftIssuedEventsBetweenBlocksFieldsFragment[]> {
      return this.multipleEntitiesQuery<
      NftIssuedEventsBetweenBlocksQuery,
      NftIssuedEventsBetweenBlocksQueryVariables
      >(NftIssuedEventsBetweenBlocks, { startBlock, endBlock }, 'nftIssuedEvents')
    }

    async nftBoughtEventsBetweenBlocks(
      startBlock: number,
      endBlock: number
    ): Promise<NftBoughtEventsBetweenBlocksFieldsFragment[]> {
      return this.multipleEntitiesQuery<
      NftBoughtEventsBetweenBlocksQuery,
      NftBoughtEventsBetweenBlocksQueryVariables
      >(NftBoughtEventsBetweenBlocks, { startBlock, endBlock }, 'nftBoughtEvents')
    }
}


