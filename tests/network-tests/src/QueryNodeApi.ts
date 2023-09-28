import { ApolloClient, DocumentNode, NormalizedCacheObject } from '@apollo/client/core'
import {
  ApplicationId,
  ForumCategoryId,
  ForumPostId,
  ForumThreadId,
  MemberId,
  OpeningId,
  ProposalId,
  WorkerId,
} from '@joystream/types/primitives'
import { OperationDefinitionNode } from 'graphql'
import { Debugger, extendDebug } from './Debugger'
import { BLOCKTIME } from './consts'
import {
  AppFieldsFragment,
  ApplicationFieldsFragment,
  ApplicationWithdrawnEventFieldsFragment,
  AppliedOnOpeningEventFieldsFragment,
  BidFieldsFragment,
  BudgetFundedEventFieldsFragment,
  BudgetSetEventFieldsFragment,
  BudgetSpendingEventFieldsFragment,
  CandidateFieldsFragment,
  CategoryArchivalStatusUpdatedEventFieldsFragment,
  CategoryCreatedEventFieldsFragment,
  CategoryDeletedEventFieldsFragment,
  CategoryMembershipOfModeratorUpdatedEventFieldsFragment,
  CategoryStickyThreadUpdateEventFieldsFragment,
  ChannelAssetsDeletedByModeratorEventFieldsFragment,
  ChannelFieldsFragment,
  ChannelFundsWithdrawnEventFieldsFragment,
  ChannelNftCollectorFieldsFragment,
  ChannelPaymentMadeEventFieldsFragment,
  ChannelPayoutsUpdatedEventFragment,
  ChannelRewardClaimedAndWithdrawnEventFieldsFragment,
  ChannelRewardClaimedEventFieldsFragment,
  CollaboratorsFieldsFragment,
  CommentCreatedEventFieldsFragment,
  CommentDeletedEventFieldsFragment,
  CommentFieldsFragment,
  CommentModeratedEventFieldsFragment,
  CommentPinnedEventFieldsFragment,
  CommentReactedEventFieldsFragment,
  CommentTextUpdatedEventFieldsFragment,
  CouncilBudgetFundedEventFieldsFragment,
  CuratorAgentPermissionsFieldsFragment,
  DistributionBucketFamilyFieldsFragment,
  ElectedCouncilFieldsFragment,
  EnglishAuctionSettledEventFieldsFragment,
  EnglishAuctionStartedEventFieldsFragment,
  ForumCategoryFieldsFragment,
  ForumPostFieldsFragment,
  ForumThreadWithInitialPostFragment,
  GetAppById,
  GetAppByIdQuery,
  GetAppByIdQueryVariables,
  GetApplicationById,
  GetApplicationByIdQuery,
  GetApplicationByIdQueryVariables,
  GetApplicationWithdrawnEventsByEventIds,
  GetApplicationWithdrawnEventsByEventIdsQuery,
  GetApplicationWithdrawnEventsByEventIdsQueryVariables,
  GetApplicationsByIds,
  GetApplicationsByIdsQuery,
  GetApplicationsByIdsQueryVariables,
  GetAppliedOnOpeningEventsByEventIds,
  GetAppliedOnOpeningEventsByEventIdsQuery,
  GetAppliedOnOpeningEventsByEventIdsQueryVariables,
  GetAppsByName,
  GetAppsByNameQuery,
  GetAppsByNameQueryVariables,
  GetBidsByMemberId,
  GetBidsByMemberIdQuery,
  GetBidsByMemberIdQueryVariables,
  GetBudgetFundedEventsByEventIds,
  GetBudgetFundedEventsByEventIdsQuery,
  GetBudgetFundedEventsByEventIdsQueryVariables,
  GetBudgetSetEventsByEventIds,
  GetBudgetSetEventsByEventIdsQuery,
  GetBudgetSetEventsByEventIdsQueryVariables,
  GetBudgetSpendingEventsByEventIds,
  GetBudgetSpendingEventsByEventIdsQuery,
  GetBudgetSpendingEventsByEventIdsQueryVariables,
  GetCategoriesByIds,
  GetCategoriesByIdsQuery,
  GetCategoriesByIdsQueryVariables,
  GetCategoryArchivalStatusUpdatedEventsByEventIds,
  GetCategoryArchivalStatusUpdatedEventsByEventIdsQuery,
  GetCategoryArchivalStatusUpdatedEventsByEventIdsQueryVariables,
  GetCategoryCreatedEventsByEventIds,
  GetCategoryCreatedEventsByEventIdsQuery,
  GetCategoryCreatedEventsByEventIdsQueryVariables,
  GetCategoryDeletedEventsByEventIds,
  GetCategoryDeletedEventsByEventIdsQuery,
  GetCategoryDeletedEventsByEventIdsQueryVariables,
  GetCategoryMembershipOfModeratorUpdatedEventsByEventIds,
  GetCategoryMembershipOfModeratorUpdatedEventsByEventIdsQuery,
  GetCategoryMembershipOfModeratorUpdatedEventsByEventIdsQueryVariables,
  GetCategoryStickyThreadUpdateEventsByEventIds,
  GetCategoryStickyThreadUpdateEventsByEventIdsQuery,
  GetCategoryStickyThreadUpdateEventsByEventIdsQueryVariables,
  GetChannelAssetsDeletedByModeratorEventsByEventIds,
  GetChannelAssetsDeletedByModeratorEventsByEventIdsQuery,
  GetChannelAssetsDeletedByModeratorEventsByEventIdsQueryVariables,
  GetChannelById,
  GetChannelByIdQuery,
  GetChannelByIdQueryVariables,
  GetChannelFundsWithdrawnEventsByEventIds,
  GetChannelFundsWithdrawnEventsByEventIdsQuery,
  GetChannelFundsWithdrawnEventsByEventIdsQueryVariables,
  GetChannelNftCollectors,
  GetChannelNftCollectorsQuery,
  GetChannelNftCollectorsQueryVariables,
  GetChannelPaymentMadeEventsByEventIds,
  GetChannelPaymentMadeEventsByEventIdsQuery,
  GetChannelPaymentMadeEventsByEventIdsQueryVariables,
  GetChannelRewardClaimedAndWithdrawnEventsByEventIds,
  GetChannelRewardClaimedAndWithdrawnEventsByEventIdsQuery,
  GetChannelRewardClaimedAndWithdrawnEventsByEventIdsQueryVariables,
  GetChannelRewardClaimedEventsByEventIds,
  GetChannelRewardClaimedEventsByEventIdsQuery,
  GetChannelRewardClaimedEventsByEventIdsQueryVariables,
  GetChannelsByIds,
  GetChannelsByIdsQuery,
  GetChannelsByIdsQueryVariables,
  GetChannelsCount,
  GetChannelsCountQuery,
  GetChannelsCountQueryVariables,
  GetCollaboratorsByChannelId,
  GetCollaboratorsByChannelIdQuery,
  GetCollaboratorsByChannelIdQueryVariables,
  GetCommentCreatedEventsByEventIds,
  GetCommentCreatedEventsByEventIdsQuery,
  GetCommentCreatedEventsByEventIdsQueryVariables,
  GetCommentDeletedEventsByEventIds,
  GetCommentDeletedEventsByEventIdsQuery,
  GetCommentDeletedEventsByEventIdsQueryVariables,
  GetCommentEditedEventsByEventIds,
  GetCommentEditedEventsByEventIdsQuery,
  GetCommentEditedEventsByEventIdsQueryVariables,
  GetCommentModeratedEventsByEventIds,
  GetCommentModeratedEventsByEventIdsQuery,
  GetCommentModeratedEventsByEventIdsQueryVariables,
  GetCommentPinnedEventsByEventIds,
  GetCommentPinnedEventsByEventIdsQuery,
  GetCommentPinnedEventsByEventIdsQueryVariables,
  GetCommentReactedEventsByEventIds,
  GetCommentReactedEventsByEventIdsQuery,
  GetCommentReactedEventsByEventIdsQueryVariables,
  GetCommentsByIds,
  GetCommentsByIdsQuery,
  GetCommentsByIdsQueryVariables,
  GetCouncilBudgetFundedEventsByEventIds,
  GetCouncilBudgetFundedEventsByEventIdsQuery,
  GetCouncilBudgetFundedEventsByEventIdsQueryVariables,
  GetCuratorPermissionsByIdAndGroupId,
  GetCuratorPermissionsByIdAndGroupIdQuery,
  GetCuratorPermissionsByIdAndGroupIdQueryVariables,
  GetCurrentCouncilMembers,
  GetCurrentCouncilMembersQuery,
  GetCurrentCouncilMembersQueryVariables,
  GetDataObjectsByChannelId,
  GetDataObjectsByChannelIdQuery,
  GetDataObjectsByChannelIdQueryVariables,
  GetDataObjectsByVideoId,
  GetDataObjectsByVideoIdQuery,
  GetDataObjectsByVideoIdQueryVariables,
  GetDistributionFamiliesAdndBuckets,
  GetDistributionFamiliesAdndBucketsQuery,
  GetDistributionFamiliesAdndBucketsQueryVariables,
  GetEnglishAuctionSettledEventsByEventIds,
  GetEnglishAuctionSettledEventsByEventIdsQuery,
  GetEnglishAuctionSettledEventsByEventIdsQueryVariables,
  GetEnglishAuctionStartedEventsByEventIds,
  GetEnglishAuctionStartedEventsByEventIdsQuery,
  GetEnglishAuctionStartedEventsByEventIdsQueryVariables,
  GetInitialInvitationBalanceUpdatedEventsByEventId,
  GetInitialInvitationBalanceUpdatedEventsByEventIdQuery,
  GetInitialInvitationBalanceUpdatedEventsByEventIdQueryVariables,
  GetInitialInvitationCountUpdatedEventsByEventId,
  GetInitialInvitationCountUpdatedEventsByEventIdQuery,
  GetInitialInvitationCountUpdatedEventsByEventIdQueryVariables,
  GetInvitesTransferredEventsBySourceMemberId,
  GetInvitesTransferredEventsBySourceMemberIdQuery,
  GetInvitesTransferredEventsBySourceMemberIdQueryVariables,
  GetLeaderSetEventsByEventIds,
  GetLeaderSetEventsByEventIdsQuery,
  GetLeaderSetEventsByEventIdsQueryVariables,
  GetLeaderUnsetEventsByEventIds,
  GetLeaderUnsetEventsByEventIdsQuery,
  GetLeaderUnsetEventsByEventIdsQueryVariables,
  GetMemberAccountsUpdatedEventsByMemberId,
  GetMemberAccountsUpdatedEventsByMemberIdQuery,
  GetMemberAccountsUpdatedEventsByMemberIdQueryVariables,
  GetMemberBannedFromChannelEventsByEventIds,
  GetMemberBannedFromChannelEventsByEventIdsQuery,
  GetMemberBannedFromChannelEventsByEventIdsQueryVariables,
  GetMemberById,
  GetMemberByIdQuery,
  GetMemberByIdQueryVariables,
  GetMemberCreatedEventsByEventIds,
  GetMemberCreatedEventsByEventIdsQuery,
  GetMemberCreatedEventsByEventIdsQueryVariables,
  GetMemberInvitedEventsByEventIds,
  GetMemberInvitedEventsByEventIdsQuery,
  GetMemberInvitedEventsByEventIdsQueryVariables,
  GetMemberProfileUpdatedEventsByMemberId,
  GetMemberProfileUpdatedEventsByMemberIdQuery,
  GetMemberProfileUpdatedEventsByMemberIdQueryVariables,
  GetMemberVerificationStatusUpdatedEventsByEventIds,
  GetMemberVerificationStatusUpdatedEventsByEventIdsQuery,
  GetMemberVerificationStatusUpdatedEventsByEventIdsQueryVariables,
  GetMembersByIds,
  GetMembersByIdsQuery,
  GetMembersByIdsQueryVariables,
  GetMembershipBoughtEventsByEventIds,
  GetMembershipBoughtEventsByEventIdsQuery,
  GetMembershipBoughtEventsByEventIdsQueryVariables,
  GetMembershipGiftedEventsByEventIds,
  GetMembershipGiftedEventsByEventIdsQuery,
  GetMembershipGiftedEventsByEventIdsQueryVariables,
  GetMembershipPriceUpdatedEventsByEventId,
  GetMembershipPriceUpdatedEventsByEventIdQuery,
  GetMembershipPriceUpdatedEventsByEventIdQueryVariables,
  GetMetaprotocolTransactionalStatusEventsByEventIds,
  GetMetaprotocolTransactionalStatusEventsByEventIdsQuery,
  GetMetaprotocolTransactionalStatusEventsByEventIdsQueryVariables,
  GetMostRecentChannelPayoutsUpdatedEvent,
  GetMostRecentChannelPayoutsUpdatedEventQuery,
  GetMostRecentChannelPayoutsUpdatedEventQueryVariables,
  GetNftIssuedEventsByEventIds,
  GetNftIssuedEventsByEventIdsQuery,
  GetNftIssuedEventsByEventIdsQueryVariables,
  GetOpeningAddedEventsByEventIds,
  GetOpeningAddedEventsByEventIdsQuery,
  GetOpeningAddedEventsByEventIdsQueryVariables,
  GetOpeningById,
  GetOpeningByIdQuery,
  GetOpeningByIdQueryVariables,
  GetOpeningCancelledEventsByEventIds,
  GetOpeningCancelledEventsByEventIdsQuery,
  GetOpeningCancelledEventsByEventIdsQueryVariables,
  GetOpeningFilledEventsByEventIds,
  GetOpeningFilledEventsByEventIdsQuery,
  GetOpeningFilledEventsByEventIdsQueryVariables,
  GetOpeningsByIds,
  GetOpeningsByIdsQuery,
  GetOpeningsByIdsQueryVariables,
  GetOwnedNftByVideoId,
  GetOwnedNftByVideoIdQuery,
  GetOwnedNftByVideoIdQueryVariables,
  GetPostAddedEventsByEventIds,
  GetPostAddedEventsByEventIdsQuery,
  GetPostAddedEventsByEventIdsQueryVariables,
  GetPostDeletedEventsByEventIds,
  GetPostDeletedEventsByEventIdsQuery,
  GetPostDeletedEventsByEventIdsQueryVariables,
  GetPostModeratedEventsByEventIds,
  GetPostModeratedEventsByEventIdsQuery,
  GetPostModeratedEventsByEventIdsQueryVariables,
  GetPostTextUpdatedEventsByEventIds,
  GetPostTextUpdatedEventsByEventIdsQuery,
  GetPostTextUpdatedEventsByEventIdsQueryVariables,
  GetPostsByIds,
  GetPostsByIdsQuery,
  GetPostsByIdsQueryVariables,
  GetProposalCancelledEventsByEventIds,
  GetProposalCancelledEventsByEventIdsQuery,
  GetProposalCancelledEventsByEventIdsQueryVariables,
  GetProposalDiscussionPostCreatedEvents,
  GetProposalDiscussionPostCreatedEventsQuery,
  GetProposalDiscussionPostCreatedEventsQueryVariables,
  GetProposalDiscussionPostDeletedEvents,
  GetProposalDiscussionPostDeletedEventsQuery,
  GetProposalDiscussionPostDeletedEventsQueryVariables,
  GetProposalDiscussionPostUpdatedEvents,
  GetProposalDiscussionPostUpdatedEventsQuery,
  GetProposalDiscussionPostUpdatedEventsQueryVariables,
  GetProposalDiscussionPostsByIds,
  GetProposalDiscussionPostsByIdsQuery,
  GetProposalDiscussionPostsByIdsQueryVariables,
  GetProposalDiscussionThreadModeChangedEvents,
  GetProposalDiscussionThreadModeChangedEventsQuery,
  GetProposalDiscussionThreadModeChangedEventsQueryVariables,
  GetProposalDiscussionThreadsByIds,
  GetProposalDiscussionThreadsByIdsQuery,
  GetProposalDiscussionThreadsByIdsQueryVariables,
  GetProposalVotedEventsByEventIds,
  GetProposalVotedEventsByEventIdsQuery,
  GetProposalVotedEventsByEventIdsQueryVariables,
  GetProposalsByIds,
  GetProposalsByIdsQuery,
  GetProposalsByIdsQueryVariables,
  GetReferendumIntermediateWinners,
  GetReferendumIntermediateWinnersQuery,
  GetReferendumIntermediateWinnersQueryVariables,
  GetReferralCutUpdatedEventsByEventId,
  GetReferralCutUpdatedEventsByEventIdQuery,
  GetReferralCutUpdatedEventsByEventIdQueryVariables,
  GetStakeDecreasedEventsByEventIds,
  GetStakeDecreasedEventsByEventIdsQuery,
  GetStakeDecreasedEventsByEventIdsQueryVariables,
  GetStakeIncreasedEventsByEventIds,
  GetStakeIncreasedEventsByEventIdsQuery,
  GetStakeIncreasedEventsByEventIdsQueryVariables,
  GetStakeSlashedEventsByEventIds,
  GetStakeSlashedEventsByEventIdsQuery,
  GetStakeSlashedEventsByEventIdsQueryVariables,
  GetStakingAccountAddedEventsByEventIds,
  GetStakingAccountAddedEventsByEventIdsQuery,
  GetStakingAccountAddedEventsByEventIdsQueryVariables,
  GetStakingAccountConfirmedEventsByEventIds,
  GetStakingAccountConfirmedEventsByEventIdsQuery,
  GetStakingAccountConfirmedEventsByEventIdsQueryVariables,
  GetStakingAccountRemovedEventsByMemberId,
  GetStakingAccountRemovedEventsByMemberIdQuery,
  GetStakingAccountRemovedEventsByMemberIdQueryVariables,
  GetStatusTextChangedEventsByEventIds,
  GetStatusTextChangedEventsByEventIdsQuery,
  GetStatusTextChangedEventsByEventIdsQueryVariables,
  GetStorageBuckets,
  GetStorageBucketsQuery,
  GetStorageBucketsQueryVariables,
  GetStorageNodesInfoByBagId,
  GetStorageNodesInfoByBagIdQuery,
  GetStorageNodesInfoByBagIdQueryVariables,
  GetTerminatedLeaderEventsByEventIds,
  GetTerminatedLeaderEventsByEventIdsQuery,
  GetTerminatedLeaderEventsByEventIdsQueryVariables,
  GetTerminatedWorkerEventsByEventIds,
  GetTerminatedWorkerEventsByEventIdsQuery,
  GetTerminatedWorkerEventsByEventIdsQueryVariables,
  GetThreadCreatedEventsByEventIds,
  GetThreadCreatedEventsByEventIdsQuery,
  GetThreadCreatedEventsByEventIdsQueryVariables,
  GetThreadDeletedEventsByEventIds,
  GetThreadDeletedEventsByEventIdsQuery,
  GetThreadDeletedEventsByEventIdsQueryVariables,
  GetThreadMetadataUpdatedEventsByEventIds,
  GetThreadMetadataUpdatedEventsByEventIdsQuery,
  GetThreadMetadataUpdatedEventsByEventIdsQueryVariables,
  GetThreadModeratedEventsByEventIds,
  GetThreadModeratedEventsByEventIdsQuery,
  GetThreadModeratedEventsByEventIdsQueryVariables,
  GetThreadMovedEventsByEventIds,
  GetThreadMovedEventsByEventIdsQuery,
  GetThreadMovedEventsByEventIdsQueryVariables,
  GetThreadsWithInitialPostsByIds,
  GetThreadsWithInitialPostsByIdsQuery,
  GetThreadsWithInitialPostsByIdsQueryVariables,
  GetUpcomingOpeningById,
  GetUpcomingOpeningByIdQuery,
  GetUpcomingOpeningByIdQueryVariables,
  GetUpcomingOpeningsByCreatedInEventIds,
  GetUpcomingOpeningsByCreatedInEventIdsQuery,
  GetUpcomingOpeningsByCreatedInEventIdsQueryVariables,
  GetVideoAssetsDeletedByModeratorEventsByEventIds,
  GetVideoAssetsDeletedByModeratorEventsByEventIdsQuery,
  GetVideoAssetsDeletedByModeratorEventsByEventIdsQueryVariables,
  GetVideoById,
  GetVideoByIdQuery,
  GetVideoByIdQueryVariables,
  GetVideoCategories,
  GetVideoCategoriesQuery,
  GetVideoCategoriesQueryVariables,
  GetVideoCategoryById,
  GetVideoCategoryByIdQuery,
  GetVideoCategoryByIdQueryVariables,
  GetVideoReactedEventsByEventIds,
  GetVideoReactedEventsByEventIdsQuery,
  GetVideoReactedEventsByEventIdsQueryVariables,
  GetVideoReactionsPreferenceEventsByEventIds,
  GetVideoReactionsPreferenceEventsByEventIdsQuery,
  GetVideoReactionsPreferenceEventsByEventIdsQueryVariables,
  GetVideoVisibilitySetByModeratorEventsByEventIdsQuery,
  GetVideoVisibilitySetByModeratorEventsByEventIdsQueryVariables,
  GetVideosByIds,
  GetVideosByIdsQuery,
  GetVideosByIdsQueryVariables,
  GetWorkerRewardAccountUpdatedEventsByEventIds,
  GetWorkerRewardAccountUpdatedEventsByEventIdsQuery,
  GetWorkerRewardAccountUpdatedEventsByEventIdsQueryVariables,
  GetWorkerRewardAmountUpdatedEventsByEventIds,
  GetWorkerRewardAmountUpdatedEventsByEventIdsQuery,
  GetWorkerRewardAmountUpdatedEventsByEventIdsQueryVariables,
  GetWorkerRoleAccountUpdatedEventsByEventIds,
  GetWorkerRoleAccountUpdatedEventsByEventIdsQuery,
  GetWorkerRoleAccountUpdatedEventsByEventIdsQueryVariables,
  GetWorkerStartedLeavingEventsByEventIds,
  GetWorkerStartedLeavingEventsByEventIdsQuery,
  GetWorkerStartedLeavingEventsByEventIdsQueryVariables,
  GetWorkersByRuntimeIds,
  GetWorkersByRuntimeIdsQuery,
  GetWorkersByRuntimeIdsQueryVariables,
  GetWorkingGroupByName,
  GetWorkingGroupByNameQuery,
  GetWorkingGroupByNameQueryVariables,
  GetWorkingGroupMetadataSnapshotsByTimeAsc,
  GetWorkingGroupMetadataSnapshotsByTimeAscQuery,
  GetWorkingGroupMetadataSnapshotsByTimeAscQueryVariables,
  InitialInvitationBalanceUpdatedEventFieldsFragment,
  InitialInvitationCountUpdatedEventFieldsFragment,
  InvitesTransferredEventFieldsFragment,
  LeaderSetEventFieldsFragment,
  LeaderUnsetEventFieldsFragment,
  MemberAccountsUpdatedEventFieldsFragment,
  MemberBannedFromChannelEventFieldsFragment,
  MemberCreatedEventFieldsFragment,
  MemberInvitedEventFieldsFragment,
  MemberProfileUpdatedEventFieldsFragment,
  MemberVerificationStatusUpdatedEventFieldsFragment,
  MembershipBoughtEventFieldsFragment,
  MembershipFieldsFragment,
  MembershipGiftedEventFieldsFragment,
  MembershipPriceUpdatedEventFieldsFragment,
  MetaprotocolTransactionStatusEventFieldsFragment,
  NftIssuedEventFieldsFragment,
  OpeningAddedEventFieldsFragment,
  OpeningCanceledEventFieldsFragment,
  OpeningFieldsFragment,
  OpeningFilledEventFieldsFragment,
  OwnedNftFieldsFragment,
  PostAddedEventFieldsFragment,
  PostDeletedEventFieldsFragment,
  PostModeratedEventFieldsFragment,
  PostTextUpdatedEventFieldsFragment,
  ProposalCancelledEventFieldsFragment,
  ProposalDiscussionPostCreatedEventFieldsFragment,
  ProposalDiscussionPostDeletedEventFieldsFragment,
  ProposalDiscussionPostFieldsFragment,
  ProposalDiscussionPostUpdatedEventFieldsFragment,
  ProposalDiscussionThreadFieldsFragment,
  ProposalDiscussionThreadModeChangedEventFieldsFragment,
  ProposalFieldsFragment,
  ProposalVotedEventFieldsFragment,
  ReferralCutUpdatedEventFieldsFragment,
  StakeDecreasedEventFieldsFragment,
  StakeIncreasedEventFieldsFragment,
  StakeSlashedEventFieldsFragment,
  StakingAccountAddedEventFieldsFragment,
  StakingAccountConfirmedEventFieldsFragment,
  StakingAccountRemovedEventFieldsFragment,
  StatusTextChangedEventFieldsFragment,
  StorageDataObjectFieldsFragment,
  StorageNodeInfoFragment,
  TerminatedLeaderEventFieldsFragment,
  TerminatedWorkerEventFieldsFragment,
  ThreadCreatedEventFieldsFragment,
  ThreadDeletedEventFieldsFragment,
  ThreadMetadataUpdatedEventFieldsFragment,
  ThreadModeratedEventFieldsFragment,
  ThreadMovedEventFieldsFragment,
  UpcomingOpeningFieldsFragment,
  VideoAssetsDeletedByModeratorEventFieldsFragment,
  VideoCategoryFieldsFragment,
  VideoFieldsFragment,
  VideoReactedEventFieldsFragment,
  VideoReactionsPreferenceEventFieldsFragment,
  VideoVisibilitySetByModeratorEventFieldsFragment,
  WorkerFieldsFragment,
  WorkerRewardAccountUpdatedEventFieldsFragment,
  WorkerRewardAmountUpdatedEventFieldsFragment,
  WorkerRoleAccountUpdatedEventFieldsFragment,
  WorkerStartedLeavingEventFieldsFragment,
  WorkingGroupFieldsFragment,
  WorkingGroupMetadataFieldsFragment,
} from './graphql/generated/queries'
import { Maybe } from './graphql/generated/schema'
import { EventDetails, WorkingGroupModuleName } from './types'
import { Utils } from './utils'

export class QueryNodeApi {
  private readonly queryNodeProvider: ApolloClient<NormalizedCacheObject>
  private readonly debug: Debugger.Debugger
  private readonly queryDebug: Debugger.Debugger
  private readonly tryDebug: Debugger.Debugger

  constructor(queryNodeProvider: ApolloClient<NormalizedCacheObject>) {
    this.queryNodeProvider = queryNodeProvider
    this.debug = extendDebug('query-node-api')
    this.queryDebug = this.debug.extend('query')
    this.tryDebug = this.debug.extend('try')
  }

  // TODO: Refactor to use graphql subscription (stateSubscription.lastCompleteBlock) instead
  public async tryQueryWithTimeout<QueryResultT>(
    query: () => Promise<QueryResultT>,
    assertResultIsValid: (res: QueryResultT) => void,
    retryTimeMs = BLOCKTIME * 9,
    retries = 6
  ): Promise<QueryResultT> {
    const label = query.toString().replace(/^.*\.([A-za-z0-9]+\(.*\))$/g, '$1')
    const debug = this.tryDebug.extend(label)
    let retryCounter = 0
    const retry = async (error: unknown) => {
      if (retryCounter === retries) {
        debug(`Max number of query retries (${retries}) reached!`)
        throw error
      }
      debug(`Retrying query in ${retryTimeMs}ms...`)
      ++retryCounter
      await Utils.wait(retryTimeMs)
    }
    while (true) {
      let result: QueryResultT
      try {
        result = await query()
      } catch (e) {
        debug(`Query node unreachable`)
        await retry(e)
        continue
      }

      try {
        assertResultIsValid(result)
      } catch (e) {
        debug(`Unexpected query result${e && (e as Error).message ? ` (${(e as Error).message})` : ''}`)
        await retry(e)
        continue
      }

      return result
    }
  }

  private debugQuery(query: DocumentNode, args: Record<string, unknown>): void {
    const queryDef = query.definitions.find((d) => d.kind === 'OperationDefinition') as OperationDefinitionNode
    this.queryDebug(`${queryDef.name?.value}(${JSON.stringify(args)})`)
  }

  // Query entity by unique input
  private async uniqueEntityQuery<
    QueryT extends { [k: string]: Maybe<Record<string, unknown>> | undefined },
    VariablesT extends Record<string, unknown>
  >(
    query: DocumentNode,
    variables: VariablesT,
    resultKey: keyof QueryT
  ): Promise<Required<QueryT>[keyof QueryT] | null> {
    this.debugQuery(query, variables)
    return (await this.queryNodeProvider.query<QueryT, VariablesT>({ query, variables })).data[resultKey] || null
  }

  // Query entities by "non-unique" input and return first result
  private async firstEntityQuery<QueryT extends { [k: string]: unknown[] }, VariablesT extends Record<string, unknown>>(
    query: DocumentNode,
    variables: VariablesT,
    resultKey: keyof QueryT
  ): Promise<QueryT[keyof QueryT][number] | null> {
    this.debugQuery(query, variables)
    return (await this.queryNodeProvider.query<QueryT, VariablesT>({ query, variables })).data[resultKey][0] || null
  }

  // Query multiple entities
  private async multipleEntitiesQuery<
    QueryT extends { [k: string]: unknown[] },
    VariablesT extends Record<string, unknown>
  >(query: DocumentNode, variables: VariablesT, resultKey: keyof QueryT): Promise<QueryT[keyof QueryT]> {
    this.debugQuery(query, variables)
    return (await this.queryNodeProvider.query<QueryT, VariablesT>({ query, variables })).data[resultKey]
  }

  public getQueryNodeEventId(blockNumber: number, indexInBlock: number): string {
    return `OLYMPIA-${blockNumber}-${indexInBlock}`
  }

  public async getMemberById(id: MemberId): Promise<MembershipFieldsFragment | null> {
    return this.uniqueEntityQuery<GetMemberByIdQuery, GetMemberByIdQueryVariables>(
      GetMemberById,
      { id: id.toString() },
      'membershipByUniqueInput'
    )
  }

  public async getMembersByIds(ids: MemberId[]): Promise<MembershipFieldsFragment[]> {
    return this.multipleEntitiesQuery<GetMembersByIdsQuery, GetMembersByIdsQueryVariables>(
      GetMembersByIds,
      { ids: ids.map((id) => id.toString()) },
      'memberships'
    )
  }

  public async getMembershipBoughtEvents(events: EventDetails[]): Promise<MembershipBoughtEventFieldsFragment[]> {
    const eventIds = events.map((e) => this.getQueryNodeEventId(e.blockNumber, e.indexInBlock))
    return this.multipleEntitiesQuery<
      GetMembershipBoughtEventsByEventIdsQuery,
      GetMembershipBoughtEventsByEventIdsQueryVariables
    >(GetMembershipBoughtEventsByEventIds, { eventIds }, 'membershipBoughtEvents')
  }

  public async getMemberProfileUpdatedEvents(memberId: MemberId): Promise<MemberProfileUpdatedEventFieldsFragment[]> {
    return this.multipleEntitiesQuery<
      GetMemberProfileUpdatedEventsByMemberIdQuery,
      GetMemberProfileUpdatedEventsByMemberIdQueryVariables
    >(GetMemberProfileUpdatedEventsByMemberId, { memberId: memberId.toString() }, 'memberProfileUpdatedEvents')
  }

  public async getMemberAccountsUpdatedEvents(memberId: MemberId): Promise<MemberAccountsUpdatedEventFieldsFragment[]> {
    return this.multipleEntitiesQuery<
      GetMemberAccountsUpdatedEventsByMemberIdQuery,
      GetMemberAccountsUpdatedEventsByMemberIdQueryVariables
    >(GetMemberAccountsUpdatedEventsByMemberId, { memberId: memberId.toString() }, 'memberAccountsUpdatedEvents')
  }

  public async getMemberCreatedEvents(events: EventDetails[]): Promise<MemberCreatedEventFieldsFragment[]> {
    const eventIds = events.map((e) => this.getQueryNodeEventId(e.blockNumber, e.indexInBlock))
    return this.multipleEntitiesQuery<
      GetMemberCreatedEventsByEventIdsQuery,
      GetMemberCreatedEventsByEventIdsQueryVariables
    >(GetMemberCreatedEventsByEventIds, { eventIds }, 'memberCreatedEvents')
  }

  public async getMembershipGiftedEvents(events: EventDetails[]): Promise<MembershipGiftedEventFieldsFragment[]> {
    const eventIds = events.map((e) => this.getQueryNodeEventId(e.blockNumber, e.indexInBlock))
    return this.multipleEntitiesQuery<
      GetMembershipGiftedEventsByEventIdsQuery,
      GetMembershipGiftedEventsByEventIdsQueryVariables
    >(GetMembershipGiftedEventsByEventIds, { eventIds }, 'membershipGiftedEvents')
  }

  public async getMemberInvitedEvents(events: EventDetails[]): Promise<MemberInvitedEventFieldsFragment[]> {
    const eventIds = events.map((e) => this.getQueryNodeEventId(e.blockNumber, e.indexInBlock))
    return this.multipleEntitiesQuery<
      GetMemberInvitedEventsByEventIdsQuery,
      GetMemberInvitedEventsByEventIdsQueryVariables
    >(GetMemberInvitedEventsByEventIds, { eventIds }, 'memberInvitedEvents')
  }

  public async getCurrentCouncilMembers(): Promise<ElectedCouncilFieldsFragment | null> {
    return this.firstEntityQuery<GetCurrentCouncilMembersQuery, GetCurrentCouncilMembersQueryVariables>(
      GetCurrentCouncilMembers,
      {},
      'electedCouncils'
    )
  }

  public async getReferendumIntermediateWinners(
    electionRoundCycleId: number,
    councilSize: number
  ): Promise<CandidateFieldsFragment[]> {
    return this.multipleEntitiesQuery<
      GetReferendumIntermediateWinnersQuery,
      GetReferendumIntermediateWinnersQueryVariables
    >(
      GetReferendumIntermediateWinners,
      {
        electionRoundCycleId,
        councilSize,
      },
      'candidates'
    )
  }

  public async getCouncilBudgetFundedEvents(events: EventDetails[]): Promise<CouncilBudgetFundedEventFieldsFragment[]> {
    const eventIds = events.map((e) => this.getQueryNodeEventId(e.blockNumber, e.indexInBlock))
    return this.multipleEntitiesQuery<
      GetCouncilBudgetFundedEventsByEventIdsQuery,
      GetCouncilBudgetFundedEventsByEventIdsQueryVariables
    >(GetCouncilBudgetFundedEventsByEventIds, { eventIds }, 'councilBudgetFundedEvents')
  }

  // TODO: Use event id
  public async getInvitesTransferredEvent(
    sourceMemberId: MemberId
  ): Promise<InvitesTransferredEventFieldsFragment | null> {
    return this.firstEntityQuery<
      GetInvitesTransferredEventsBySourceMemberIdQuery,
      GetInvitesTransferredEventsBySourceMemberIdQueryVariables
    >(
      GetInvitesTransferredEventsBySourceMemberId,
      { sourceMemberId: sourceMemberId.toString() },
      'invitesTransferredEvents'
    )
  }

  public async getStakingAccountAddedEvents(events: EventDetails[]): Promise<StakingAccountAddedEventFieldsFragment[]> {
    const eventIds = events.map((e) => this.getQueryNodeEventId(e.blockNumber, e.indexInBlock))
    return this.multipleEntitiesQuery<
      GetStakingAccountAddedEventsByEventIdsQuery,
      GetStakingAccountAddedEventsByEventIdsQueryVariables
    >(GetStakingAccountAddedEventsByEventIds, { ids: eventIds }, 'stakingAccountAddedEvents')
  }

  public async getStakingAccountConfirmedEvents(
    events: EventDetails[]
  ): Promise<StakingAccountConfirmedEventFieldsFragment[]> {
    const eventIds = events.map((e) => this.getQueryNodeEventId(e.blockNumber, e.indexInBlock))
    return this.multipleEntitiesQuery<
      GetStakingAccountConfirmedEventsByEventIdsQuery,
      GetStakingAccountConfirmedEventsByEventIdsQueryVariables
    >(GetStakingAccountConfirmedEventsByEventIds, { ids: eventIds }, 'stakingAccountConfirmedEvents')
  }

  public async getStakingAccountRemovedEvents(memberId: MemberId): Promise<StakingAccountRemovedEventFieldsFragment[]> {
    return this.multipleEntitiesQuery<
      GetStakingAccountRemovedEventsByMemberIdQuery,
      GetStakingAccountRemovedEventsByMemberIdQueryVariables
    >(GetStakingAccountRemovedEventsByMemberId, { memberId: memberId.toString() }, 'stakingAccountRemovedEvents')
  }

  public async getReferralCutUpdatedEvent(
    blockNumber: number,
    indexInBlock: number
  ): Promise<ReferralCutUpdatedEventFieldsFragment | null> {
    return this.firstEntityQuery<
      GetReferralCutUpdatedEventsByEventIdQuery,
      GetReferralCutUpdatedEventsByEventIdQueryVariables
    >(
      GetReferralCutUpdatedEventsByEventId,
      { eventId: this.getQueryNodeEventId(blockNumber, indexInBlock) },
      'referralCutUpdatedEvents'
    )
  }

  public async getMembershipPriceUpdatedEvent(
    blockNumber: number,
    indexInBlock: number
  ): Promise<MembershipPriceUpdatedEventFieldsFragment | null> {
    return this.firstEntityQuery<
      GetMembershipPriceUpdatedEventsByEventIdQuery,
      GetMembershipPriceUpdatedEventsByEventIdQueryVariables
    >(
      GetMembershipPriceUpdatedEventsByEventId,
      { eventId: this.getQueryNodeEventId(blockNumber, indexInBlock) },
      'membershipPriceUpdatedEvents'
    )
  }

  public async getInitialInvitationBalanceUpdatedEvent(
    blockNumber: number,
    indexInBlock: number
  ): Promise<InitialInvitationBalanceUpdatedEventFieldsFragment | null> {
    return this.firstEntityQuery<
      GetInitialInvitationBalanceUpdatedEventsByEventIdQuery,
      GetInitialInvitationBalanceUpdatedEventsByEventIdQueryVariables
    >(
      GetInitialInvitationBalanceUpdatedEventsByEventId,
      { eventId: this.getQueryNodeEventId(blockNumber, indexInBlock) },
      'initialInvitationBalanceUpdatedEvents'
    )
  }

  public async getInitialInvitationCountUpdatedEvent(
    blockNumber: number,
    indexInBlock: number
  ): Promise<InitialInvitationCountUpdatedEventFieldsFragment | null> {
    return this.firstEntityQuery<
      GetInitialInvitationCountUpdatedEventsByEventIdQuery,
      GetInitialInvitationCountUpdatedEventsByEventIdQueryVariables
    >(
      GetInitialInvitationCountUpdatedEventsByEventId,
      { eventId: this.getQueryNodeEventId(blockNumber, indexInBlock) },
      'initialInvitationCountUpdatedEvents'
    )
  }

  public async getOpeningById(id: OpeningId, group: WorkingGroupModuleName): Promise<OpeningFieldsFragment | null> {
    return this.uniqueEntityQuery<GetOpeningByIdQuery, GetOpeningByIdQueryVariables>(
      GetOpeningById,
      { openingId: `${group}-${id.toString()}` },
      'workingGroupOpeningByUniqueInput'
    )
  }

  public async getOpeningsByIds(ids: OpeningId[], group: WorkingGroupModuleName): Promise<OpeningFieldsFragment[]> {
    const openingIds = ids.map((id) => `${group}-${id.toString()}`)
    return this.multipleEntitiesQuery<GetOpeningsByIdsQuery, GetOpeningsByIdsQueryVariables>(
      GetOpeningsByIds,
      { openingIds },
      'workingGroupOpenings'
    )
  }

  public async getApplicationById(
    id: ApplicationId,
    group: WorkingGroupModuleName
  ): Promise<ApplicationFieldsFragment | null> {
    return this.uniqueEntityQuery<GetApplicationByIdQuery, GetApplicationByIdQueryVariables>(
      GetApplicationById,
      { applicationId: `${group}-${id.toString()}` },
      'workingGroupApplicationByUniqueInput'
    )
  }

  public async getApplicationsByIds(
    ids: ApplicationId[],
    group: WorkingGroupModuleName
  ): Promise<ApplicationFieldsFragment[]> {
    const applicationIds = ids.map((id) => `${group}-${id.toString()}`)
    return this.multipleEntitiesQuery<GetApplicationsByIdsQuery, GetApplicationsByIdsQueryVariables>(
      GetApplicationsByIds,
      { applicationIds },
      'workingGroupApplications'
    )
  }

  public async getAppliedOnOpeningEvents(events: EventDetails[]): Promise<AppliedOnOpeningEventFieldsFragment[]> {
    const eventIds = events.map((e) => this.getQueryNodeEventId(e.blockNumber, e.indexInBlock))
    return this.multipleEntitiesQuery<
      GetAppliedOnOpeningEventsByEventIdsQuery,
      GetAppliedOnOpeningEventsByEventIdsQueryVariables
    >(GetAppliedOnOpeningEventsByEventIds, { eventIds }, 'appliedOnOpeningEvents')
  }

  public async getOpeningAddedEvents(events: EventDetails[]): Promise<OpeningAddedEventFieldsFragment[]> {
    const eventIds = events.map((e) => this.getQueryNodeEventId(e.blockNumber, e.indexInBlock))
    return this.multipleEntitiesQuery<
      GetOpeningAddedEventsByEventIdsQuery,
      GetOpeningAddedEventsByEventIdsQueryVariables
    >(GetOpeningAddedEventsByEventIds, { eventIds }, 'openingAddedEvents')
  }

  public async getOpeningFilledEvents(events: EventDetails[]): Promise<OpeningFilledEventFieldsFragment[]> {
    const eventIds = events.map((e) => this.getQueryNodeEventId(e.blockNumber, e.indexInBlock))
    return this.multipleEntitiesQuery<
      GetOpeningFilledEventsByEventIdsQuery,
      GetOpeningFilledEventsByEventIdsQueryVariables
    >(GetOpeningFilledEventsByEventIds, { eventIds }, 'openingFilledEvents')
  }

  public async getApplicationWithdrawnEvents(
    events: EventDetails[]
  ): Promise<ApplicationWithdrawnEventFieldsFragment[]> {
    const eventIds = events.map((e) => this.getQueryNodeEventId(e.blockNumber, e.indexInBlock))
    return this.multipleEntitiesQuery<
      GetApplicationWithdrawnEventsByEventIdsQuery,
      GetApplicationWithdrawnEventsByEventIdsQueryVariables
    >(GetApplicationWithdrawnEventsByEventIds, { eventIds }, 'applicationWithdrawnEvents')
  }

  public async getOpeningCancelledEvents(events: EventDetails[]): Promise<OpeningCanceledEventFieldsFragment[]> {
    const eventIds = events.map((e) => this.getQueryNodeEventId(e.blockNumber, e.indexInBlock))
    return this.multipleEntitiesQuery<
      GetOpeningCancelledEventsByEventIdsQuery,
      GetOpeningCancelledEventsByEventIdsQueryVariables
    >(GetOpeningCancelledEventsByEventIds, { eventIds }, 'openingCanceledEvents')
  }

  public async getStatusTextChangedEvents(events: EventDetails[]): Promise<StatusTextChangedEventFieldsFragment[]> {
    const eventIds = events.map((e) => this.getQueryNodeEventId(e.blockNumber, e.indexInBlock))
    return this.multipleEntitiesQuery<
      GetStatusTextChangedEventsByEventIdsQuery,
      GetStatusTextChangedEventsByEventIdsQueryVariables
    >(GetStatusTextChangedEventsByEventIds, { eventIds }, 'statusTextChangedEvents')
  }

  public async getUpcomingOpeningById(id: string): Promise<UpcomingOpeningFieldsFragment | null> {
    return this.uniqueEntityQuery<GetUpcomingOpeningByIdQuery, GetUpcomingOpeningByIdQueryVariables>(
      GetUpcomingOpeningById,
      { id },
      'upcomingWorkingGroupOpeningByUniqueInput'
    )
  }

  public async getUpcomingOpeningsByCreatedInEventIds(eventIds: string[]): Promise<UpcomingOpeningFieldsFragment[]> {
    return this.multipleEntitiesQuery<
      GetUpcomingOpeningsByCreatedInEventIdsQuery,
      GetUpcomingOpeningsByCreatedInEventIdsQueryVariables
    >(GetUpcomingOpeningsByCreatedInEventIds, { createdInEventIds: eventIds }, 'upcomingWorkingGroupOpenings')
  }

  public async getWorkingGroup(name: WorkingGroupModuleName): Promise<WorkingGroupFieldsFragment | null> {
    return this.uniqueEntityQuery<GetWorkingGroupByNameQuery, GetWorkingGroupByNameQueryVariables>(
      GetWorkingGroupByName,
      { name },
      'workingGroupByUniqueInput'
    )
  }

  public async getGroupMetaSnapshotsByTimeAsc(groupId: string): Promise<WorkingGroupMetadataFieldsFragment[]> {
    return this.multipleEntitiesQuery<
      GetWorkingGroupMetadataSnapshotsByTimeAscQuery,
      GetWorkingGroupMetadataSnapshotsByTimeAscQueryVariables
    >(GetWorkingGroupMetadataSnapshotsByTimeAsc, { groupId }, 'workingGroupMetadata')
  }

  public async getWorkerRoleAccountUpdatedEvents(
    events: EventDetails[]
  ): Promise<WorkerRoleAccountUpdatedEventFieldsFragment[]> {
    const eventIds = events.map((e) => this.getQueryNodeEventId(e.blockNumber, e.indexInBlock))
    return this.multipleEntitiesQuery<
      GetWorkerRoleAccountUpdatedEventsByEventIdsQuery,
      GetWorkerRoleAccountUpdatedEventsByEventIdsQueryVariables
    >(GetWorkerRoleAccountUpdatedEventsByEventIds, { eventIds }, 'workerRoleAccountUpdatedEvents')
  }

  public async getWorkerRewardAccountUpdatedEvents(
    events: EventDetails[]
  ): Promise<WorkerRewardAccountUpdatedEventFieldsFragment[]> {
    const eventIds = events.map((e) => this.getQueryNodeEventId(e.blockNumber, e.indexInBlock))
    return this.multipleEntitiesQuery<
      GetWorkerRewardAccountUpdatedEventsByEventIdsQuery,
      GetWorkerRewardAccountUpdatedEventsByEventIdsQueryVariables
    >(GetWorkerRewardAccountUpdatedEventsByEventIds, { eventIds }, 'workerRewardAccountUpdatedEvents')
  }

  public async getStakeIncreasedEvents(events: EventDetails[]): Promise<StakeIncreasedEventFieldsFragment[]> {
    const eventIds = events.map((e) => this.getQueryNodeEventId(e.blockNumber, e.indexInBlock))
    return this.multipleEntitiesQuery<
      GetStakeIncreasedEventsByEventIdsQuery,
      GetStakeIncreasedEventsByEventIdsQueryVariables
    >(GetStakeIncreasedEventsByEventIds, { eventIds }, 'stakeIncreasedEvents')
  }

  public async getWorkersByIds(ids: WorkerId[], group: WorkingGroupModuleName): Promise<WorkerFieldsFragment[]> {
    return this.multipleEntitiesQuery<GetWorkersByRuntimeIdsQuery, GetWorkersByRuntimeIdsQueryVariables>(
      GetWorkersByRuntimeIds,
      { workerIds: ids.map((id) => id.toNumber()), groupId: group },
      'workers'
    )
  }

  public async getWorkerStartedLeavingEvents(
    events: EventDetails[]
  ): Promise<WorkerStartedLeavingEventFieldsFragment[]> {
    const eventIds = events.map((e) => this.getQueryNodeEventId(e.blockNumber, e.indexInBlock))
    return this.multipleEntitiesQuery<
      GetWorkerStartedLeavingEventsByEventIdsQuery,
      GetWorkerStartedLeavingEventsByEventIdsQueryVariables
    >(GetWorkerStartedLeavingEventsByEventIds, { eventIds }, 'workerStartedLeavingEvents')
  }

  public async getTerminatedWorkerEvents(events: EventDetails[]): Promise<TerminatedWorkerEventFieldsFragment[]> {
    const eventIds = events.map((e) => this.getQueryNodeEventId(e.blockNumber, e.indexInBlock))
    return this.multipleEntitiesQuery<
      GetTerminatedWorkerEventsByEventIdsQuery,
      GetTerminatedWorkerEventsByEventIdsQueryVariables
    >(GetTerminatedWorkerEventsByEventIds, { eventIds }, 'terminatedWorkerEvents')
  }

  public async getTerminatedLeaderEvents(events: EventDetails[]): Promise<TerminatedLeaderEventFieldsFragment[]> {
    const eventIds = events.map((e) => this.getQueryNodeEventId(e.blockNumber, e.indexInBlock))
    return this.multipleEntitiesQuery<
      GetTerminatedLeaderEventsByEventIdsQuery,
      GetTerminatedLeaderEventsByEventIdsQueryVariables
    >(GetTerminatedLeaderEventsByEventIds, { eventIds }, 'terminatedLeaderEvents')
  }

  public async getWorkerRewardAmountUpdatedEvents(
    events: EventDetails[]
  ): Promise<WorkerRewardAmountUpdatedEventFieldsFragment[]> {
    const eventIds = events.map((e) => this.getQueryNodeEventId(e.blockNumber, e.indexInBlock))
    return this.multipleEntitiesQuery<
      GetWorkerRewardAmountUpdatedEventsByEventIdsQuery,
      GetWorkerRewardAmountUpdatedEventsByEventIdsQueryVariables
    >(GetWorkerRewardAmountUpdatedEventsByEventIds, { eventIds }, 'workerRewardAmountUpdatedEvents')
  }

  public async getStakeSlashedEvents(events: EventDetails[]): Promise<StakeSlashedEventFieldsFragment[]> {
    const eventIds = events.map((e) => this.getQueryNodeEventId(e.blockNumber, e.indexInBlock))
    return this.multipleEntitiesQuery<
      GetStakeSlashedEventsByEventIdsQuery,
      GetStakeSlashedEventsByEventIdsQueryVariables
    >(GetStakeSlashedEventsByEventIds, { eventIds }, 'stakeSlashedEvents')
  }

  public async getStakeDecreasedEvents(events: EventDetails[]): Promise<StakeDecreasedEventFieldsFragment[]> {
    const eventIds = events.map((e) => this.getQueryNodeEventId(e.blockNumber, e.indexInBlock))
    return this.multipleEntitiesQuery<
      GetStakeDecreasedEventsByEventIdsQuery,
      GetStakeDecreasedEventsByEventIdsQueryVariables
    >(GetStakeDecreasedEventsByEventIds, { eventIds }, 'stakeDecreasedEvents')
  }

  public async getBudgetSetEvents(events: EventDetails[]): Promise<BudgetSetEventFieldsFragment[]> {
    const eventIds = events.map((e) => this.getQueryNodeEventId(e.blockNumber, e.indexInBlock))
    return this.multipleEntitiesQuery<GetBudgetSetEventsByEventIdsQuery, GetBudgetSetEventsByEventIdsQueryVariables>(
      GetBudgetSetEventsByEventIds,
      { eventIds },
      'budgetSetEvents'
    )
  }

  public async getBudgetFundedEvents(events: EventDetails[]): Promise<BudgetFundedEventFieldsFragment[]> {
    const eventIds = events.map((e) => this.getQueryNodeEventId(e.blockNumber, e.indexInBlock))
    return this.multipleEntitiesQuery<
      GetBudgetFundedEventsByEventIdsQuery,
      GetBudgetFundedEventsByEventIdsQueryVariables
    >(GetBudgetFundedEventsByEventIds, { eventIds }, 'budgetFundedEvents')
  }

  public async getBudgetSpendingEvents(events: EventDetails[]): Promise<BudgetSpendingEventFieldsFragment[]> {
    const eventIds = events.map((e) => this.getQueryNodeEventId(e.blockNumber, e.indexInBlock))
    return this.multipleEntitiesQuery<
      GetBudgetSpendingEventsByEventIdsQuery,
      GetBudgetSpendingEventsByEventIdsQueryVariables
    >(GetBudgetSpendingEventsByEventIds, { eventIds }, 'budgetSpendingEvents')
  }

  public async getLeaderSetEvent(event: EventDetails): Promise<LeaderSetEventFieldsFragment | null> {
    const eventId = this.getQueryNodeEventId(event.blockNumber, event.indexInBlock)
    return this.firstEntityQuery<GetLeaderSetEventsByEventIdsQuery, GetLeaderSetEventsByEventIdsQueryVariables>(
      GetLeaderSetEventsByEventIds,
      { eventIds: [eventId] },
      'leaderSetEvents'
    )
  }

  public async getLeaderUnsetEvent(event: EventDetails): Promise<LeaderUnsetEventFieldsFragment | null> {
    const eventId = this.getQueryNodeEventId(event.blockNumber, event.indexInBlock)
    return this.firstEntityQuery<GetLeaderUnsetEventsByEventIdsQuery, GetLeaderUnsetEventsByEventIdsQueryVariables>(
      GetLeaderUnsetEventsByEventIds,
      { eventIds: [eventId] },
      'leaderUnsetEvents'
    )
  }

  public async getProposalsByIds(ids: (ProposalId | string)[]): Promise<ProposalFieldsFragment[]> {
    return this.multipleEntitiesQuery<GetProposalsByIdsQuery, GetProposalsByIdsQueryVariables>(
      GetProposalsByIds,
      { ids: ids.map((id) => id.toString()) },
      'proposals'
    )
  }

  public async getProposalVotedEvents(events: EventDetails[]): Promise<ProposalVotedEventFieldsFragment[]> {
    const eventIds = events.map((e) => this.getQueryNodeEventId(e.blockNumber, e.indexInBlock))
    return this.multipleEntitiesQuery<
      GetProposalVotedEventsByEventIdsQuery,
      GetProposalVotedEventsByEventIdsQueryVariables
    >(GetProposalVotedEventsByEventIds, { eventIds }, 'proposalVotedEvents')
  }

  public async getProposalCancelledEvents(events: EventDetails[]): Promise<ProposalCancelledEventFieldsFragment[]> {
    const eventIds = events.map((e) => this.getQueryNodeEventId(e.blockNumber, e.indexInBlock))
    return this.multipleEntitiesQuery<
      GetProposalCancelledEventsByEventIdsQuery,
      GetProposalCancelledEventsByEventIdsQueryVariables
    >(GetProposalCancelledEventsByEventIds, { eventIds }, 'proposalCancelledEvents')
  }

  public async getCategoriesByIds(ids: ForumCategoryId[]): Promise<ForumCategoryFieldsFragment[]> {
    return this.multipleEntitiesQuery<GetCategoriesByIdsQuery, GetCategoriesByIdsQueryVariables>(
      GetCategoriesByIds,
      { ids: ids.map((id) => id.toString()) },
      'forumCategories'
    )
  }

  public async getCategoryCreatedEvents(events: EventDetails[]): Promise<CategoryCreatedEventFieldsFragment[]> {
    const eventIds = events.map((e) => this.getQueryNodeEventId(e.blockNumber, e.indexInBlock))
    return this.multipleEntitiesQuery<
      GetCategoryCreatedEventsByEventIdsQuery,
      GetCategoryCreatedEventsByEventIdsQueryVariables
    >(GetCategoryCreatedEventsByEventIds, { eventIds }, 'categoryCreatedEvents')
  }

  public async getCategoryArchivalStatusUpdatedEvents(
    events: EventDetails[]
  ): Promise<CategoryArchivalStatusUpdatedEventFieldsFragment[]> {
    const eventIds = events.map((e) => this.getQueryNodeEventId(e.blockNumber, e.indexInBlock))
    return this.multipleEntitiesQuery<
      GetCategoryArchivalStatusUpdatedEventsByEventIdsQuery,
      GetCategoryArchivalStatusUpdatedEventsByEventIdsQueryVariables
    >(GetCategoryArchivalStatusUpdatedEventsByEventIds, { eventIds }, 'categoryArchivalStatusUpdatedEvents')
  }

  public async getCategoryDeletedEvents(events: EventDetails[]): Promise<CategoryDeletedEventFieldsFragment[]> {
    const eventIds = events.map((e) => this.getQueryNodeEventId(e.blockNumber, e.indexInBlock))
    return this.multipleEntitiesQuery<
      GetCategoryDeletedEventsByEventIdsQuery,
      GetCategoryDeletedEventsByEventIdsQueryVariables
    >(GetCategoryDeletedEventsByEventIds, { eventIds }, 'categoryDeletedEvents')
  }

  public async getThreadCreatedEvents(events: EventDetails[]): Promise<ThreadCreatedEventFieldsFragment[]> {
    const eventIds = events.map((e) => this.getQueryNodeEventId(e.blockNumber, e.indexInBlock))
    return this.multipleEntitiesQuery<
      GetThreadCreatedEventsByEventIdsQuery,
      GetThreadCreatedEventsByEventIdsQueryVariables
    >(GetThreadCreatedEventsByEventIds, { eventIds }, 'threadCreatedEvents')
  }

  public async getThreadMetadataUpdatedEvents(
    events: EventDetails[]
  ): Promise<ThreadMetadataUpdatedEventFieldsFragment[]> {
    const eventIds = events.map((e) => this.getQueryNodeEventId(e.blockNumber, e.indexInBlock))
    return this.multipleEntitiesQuery<
      GetThreadMetadataUpdatedEventsByEventIdsQuery,
      GetThreadMetadataUpdatedEventsByEventIdsQueryVariables
    >(GetThreadMetadataUpdatedEventsByEventIds, { eventIds }, 'threadMetadataUpdatedEvents')
  }

  public async getThreadsWithInitialPostsByIds(ids: ForumThreadId[]): Promise<ForumThreadWithInitialPostFragment[]> {
    return this.multipleEntitiesQuery<
      GetThreadsWithInitialPostsByIdsQuery,
      GetThreadsWithInitialPostsByIdsQueryVariables
    >(GetThreadsWithInitialPostsByIds, { ids: ids.map((id) => id.toString()) }, 'forumThreads')
  }

  public async getThreadDeletedEvents(events: EventDetails[]): Promise<ThreadDeletedEventFieldsFragment[]> {
    const eventIds = events.map((e) => this.getQueryNodeEventId(e.blockNumber, e.indexInBlock))
    return this.multipleEntitiesQuery<
      GetThreadDeletedEventsByEventIdsQuery,
      GetThreadDeletedEventsByEventIdsQueryVariables
    >(GetThreadDeletedEventsByEventIds, { eventIds }, 'threadDeletedEvents')
  }

  public async getPostsByIds(ids: ForumPostId[]): Promise<ForumPostFieldsFragment[]> {
    return this.multipleEntitiesQuery<GetPostsByIdsQuery, GetPostsByIdsQueryVariables>(
      GetPostsByIds,
      { ids: ids.map((id) => id.toString()) },
      'forumPosts'
    )
  }

  public async getPostAddedEvents(events: EventDetails[]): Promise<PostAddedEventFieldsFragment[]> {
    const eventIds = events.map((e) => this.getQueryNodeEventId(e.blockNumber, e.indexInBlock))
    return this.multipleEntitiesQuery<GetPostAddedEventsByEventIdsQuery, GetPostAddedEventsByEventIdsQueryVariables>(
      GetPostAddedEventsByEventIds,
      { eventIds },
      'postAddedEvents'
    )
  }

  public async getThreadMovedEvents(events: EventDetails[]): Promise<ThreadMovedEventFieldsFragment[]> {
    const eventIds = events.map((e) => this.getQueryNodeEventId(e.blockNumber, e.indexInBlock))
    return this.multipleEntitiesQuery<
      GetThreadMovedEventsByEventIdsQuery,
      GetThreadMovedEventsByEventIdsQueryVariables
    >(GetThreadMovedEventsByEventIds, { eventIds }, 'threadMovedEvents')
  }

  public async getCategoryStickyThreadUpdateEvents(
    events: EventDetails[]
  ): Promise<CategoryStickyThreadUpdateEventFieldsFragment[]> {
    const eventIds = events.map((e) => this.getQueryNodeEventId(e.blockNumber, e.indexInBlock))
    return this.multipleEntitiesQuery<
      GetCategoryStickyThreadUpdateEventsByEventIdsQuery,
      GetCategoryStickyThreadUpdateEventsByEventIdsQueryVariables
    >(GetCategoryStickyThreadUpdateEventsByEventIds, { eventIds }, 'categoryStickyThreadUpdateEvents')
  }

  public async getCategoryMembershipOfModeratorUpdatedEvents(
    events: EventDetails[]
  ): Promise<CategoryMembershipOfModeratorUpdatedEventFieldsFragment[]> {
    const eventIds = events.map((e) => this.getQueryNodeEventId(e.blockNumber, e.indexInBlock))
    return this.multipleEntitiesQuery<
      GetCategoryMembershipOfModeratorUpdatedEventsByEventIdsQuery,
      GetCategoryMembershipOfModeratorUpdatedEventsByEventIdsQueryVariables
    >(
      GetCategoryMembershipOfModeratorUpdatedEventsByEventIds,
      { eventIds },
      'categoryMembershipOfModeratorUpdatedEvents'
    )
  }

  public async getThreadModeratedEvents(events: EventDetails[]): Promise<ThreadModeratedEventFieldsFragment[]> {
    const eventIds = events.map((e) => this.getQueryNodeEventId(e.blockNumber, e.indexInBlock))
    return this.multipleEntitiesQuery<
      GetThreadModeratedEventsByEventIdsQuery,
      GetThreadModeratedEventsByEventIdsQueryVariables
    >(GetThreadModeratedEventsByEventIds, { eventIds }, 'threadModeratedEvents')
  }

  public async getPostModeratedEvents(events: EventDetails[]): Promise<PostModeratedEventFieldsFragment[]> {
    const eventIds = events.map((e) => this.getQueryNodeEventId(e.blockNumber, e.indexInBlock))
    return this.multipleEntitiesQuery<
      GetPostModeratedEventsByEventIdsQuery,
      GetPostModeratedEventsByEventIdsQueryVariables
    >(GetPostModeratedEventsByEventIds, { eventIds }, 'postModeratedEvents')
  }

  public async getPostTextUpdatedEvents(events: EventDetails[]): Promise<PostTextUpdatedEventFieldsFragment[]> {
    const eventIds = events.map((e) => this.getQueryNodeEventId(e.blockNumber, e.indexInBlock))
    return this.multipleEntitiesQuery<
      GetPostTextUpdatedEventsByEventIdsQuery,
      GetPostTextUpdatedEventsByEventIdsQueryVariables
    >(GetPostTextUpdatedEventsByEventIds, { eventIds }, 'postTextUpdatedEvents')
  }

  public async getPostDeletedEvents(events: EventDetails[]): Promise<PostDeletedEventFieldsFragment[]> {
    const eventIds = events.map((e) => this.getQueryNodeEventId(e.blockNumber, e.indexInBlock))
    return this.multipleEntitiesQuery<
      GetPostDeletedEventsByEventIdsQuery,
      GetPostDeletedEventsByEventIdsQueryVariables
    >(GetPostDeletedEventsByEventIds, { eventIds }, 'postDeletedEvents')
  }

  public async getProposalDiscussionPostCreatedEvents(
    events: EventDetails[]
  ): Promise<ProposalDiscussionPostCreatedEventFieldsFragment[]> {
    const eventIds = events.map((e) => this.getQueryNodeEventId(e.blockNumber, e.indexInBlock))
    return this.multipleEntitiesQuery<
      GetProposalDiscussionPostCreatedEventsQuery,
      GetProposalDiscussionPostCreatedEventsQueryVariables
    >(GetProposalDiscussionPostCreatedEvents, { eventIds }, 'proposalDiscussionPostCreatedEvents')
  }

  public async getProposalDiscussionPostUpdatedEvents(
    events: EventDetails[]
  ): Promise<ProposalDiscussionPostUpdatedEventFieldsFragment[]> {
    const eventIds = events.map((e) => this.getQueryNodeEventId(e.blockNumber, e.indexInBlock))
    return this.multipleEntitiesQuery<
      GetProposalDiscussionPostUpdatedEventsQuery,
      GetProposalDiscussionPostUpdatedEventsQueryVariables
    >(GetProposalDiscussionPostUpdatedEvents, { eventIds }, 'proposalDiscussionPostUpdatedEvents')
  }

  public async getProposalDiscussionThreadModeChangedEvents(
    events: EventDetails[]
  ): Promise<ProposalDiscussionThreadModeChangedEventFieldsFragment[]> {
    const eventIds = events.map((e) => this.getQueryNodeEventId(e.blockNumber, e.indexInBlock))
    return this.multipleEntitiesQuery<
      GetProposalDiscussionThreadModeChangedEventsQuery,
      GetProposalDiscussionThreadModeChangedEventsQueryVariables
    >(GetProposalDiscussionThreadModeChangedEvents, { eventIds }, 'proposalDiscussionThreadModeChangedEvents')
  }

  public async getProposalDiscussionPostDeletedEvents(
    events: EventDetails[]
  ): Promise<ProposalDiscussionPostDeletedEventFieldsFragment[]> {
    const eventIds = events.map((e) => this.getQueryNodeEventId(e.blockNumber, e.indexInBlock))
    return this.multipleEntitiesQuery<
      GetProposalDiscussionPostDeletedEventsQuery,
      GetProposalDiscussionPostDeletedEventsQueryVariables
    >(GetProposalDiscussionPostDeletedEvents, { eventIds }, 'proposalDiscussionPostDeletedEvents')
  }

  public async getProposalDiscussionPostsByIds(
    ids: (ForumPostId | number)[]
  ): Promise<ProposalDiscussionPostFieldsFragment[]> {
    return this.multipleEntitiesQuery<
      GetProposalDiscussionPostsByIdsQuery,
      GetProposalDiscussionPostsByIdsQueryVariables
    >(GetProposalDiscussionPostsByIds, { ids: ids.map((id) => id.toString()) }, 'proposalDiscussionPosts')
  }

  public async getProposalDiscussionThreadsByIds(
    ids: (ForumPostId | number)[]
  ): Promise<ProposalDiscussionThreadFieldsFragment[]> {
    return this.multipleEntitiesQuery<
      GetProposalDiscussionThreadsByIdsQuery,
      GetProposalDiscussionThreadsByIdsQueryVariables
    >(GetProposalDiscussionThreadsByIds, { ids: ids.map((id) => id.toString()) }, 'proposalDiscussionThreads')
  }

  public async channelById(id: string): Promise<Maybe<ChannelFieldsFragment>> {
    return this.uniqueEntityQuery<GetChannelByIdQuery, GetChannelByIdQueryVariables>(
      GetChannelById,
      { id },
      'channelByUniqueInput'
    )
  }

  public async channelsByIds(ids: string[]): Promise<ChannelFieldsFragment[]> {
    return this.multipleEntitiesQuery<GetChannelsByIdsQuery, GetChannelsByIdsQueryVariables>(
      GetChannelsByIds,
      { ids },
      'channels'
    )
  }

  public async videoCategoryById(id: string): Promise<Maybe<VideoCategoryFieldsFragment>> {
    return this.uniqueEntityQuery<GetVideoCategoryByIdQuery, GetVideoCategoryByIdQueryVariables>(
      GetVideoCategoryById,
      { id },
      'videoCategoryByUniqueInput'
    )
  }

  public async getVideoCategories(): Promise<VideoCategoryFieldsFragment[]> {
    return this.multipleEntitiesQuery<GetVideoCategoriesQuery, GetVideoCategoriesQueryVariables>(
      GetVideoCategories,
      {},
      'videoCategories'
    )
  }

  public async ownedNftByVideoId(videoId: string): Promise<Maybe<OwnedNftFieldsFragment>> {
    return this.firstEntityQuery<GetOwnedNftByVideoIdQuery, GetOwnedNftByVideoIdQueryVariables>(
      GetOwnedNftByVideoId,
      { videoId },
      'ownedNfts'
    )
  }

  public async bidsByMemberId(videoId: string, memberId: string): Promise<BidFieldsFragment[]> {
    return this.multipleEntitiesQuery<GetBidsByMemberIdQuery, GetBidsByMemberIdQueryVariables>(
      GetBidsByMemberId,
      { videoId, memberId },
      'bids'
    )
  }

  public async getChannelNftCollectors(): Promise<ChannelNftCollectorFieldsFragment[]> {
    return this.multipleEntitiesQuery<GetChannelNftCollectorsQuery, GetChannelNftCollectorsQueryVariables>(
      GetChannelNftCollectors,
      {},
      'channelNftCollectors'
    )
  }

  public async dataObjectsByChannelId(channelId: string): Promise<StorageDataObjectFieldsFragment[]> {
    return this.multipleEntitiesQuery<GetDataObjectsByChannelIdQuery, GetDataObjectsByChannelIdQueryVariables>(
      GetDataObjectsByChannelId,
      { channelId },
      'storageDataObjects'
    )
  }

  public async dataObjectsByVideoId(videoId: string): Promise<StorageDataObjectFieldsFragment[]> {
    return this.multipleEntitiesQuery<GetDataObjectsByVideoIdQuery, GetDataObjectsByVideoIdQueryVariables>(
      GetDataObjectsByVideoId,
      { videoId },
      'storageDataObjects'
    )
  }

  public async getCuratorPermissionsByIdAndGroupId(
    curatorGroupId: string,
    curatorId: string
  ): Promise<Maybe<CuratorAgentPermissionsFieldsFragment>> {
    return this.firstEntityQuery<
      GetCuratorPermissionsByIdAndGroupIdQuery,
      GetCuratorPermissionsByIdAndGroupIdQueryVariables
    >(GetCuratorPermissionsByIdAndGroupId, { curatorGroupId, curatorId }, 'curatorAgentPermissions')
  }

  public async getCollaboratorsByChannelId(channelId: string): Promise<CollaboratorsFieldsFragment[]> {
    return this.multipleEntitiesQuery<GetCollaboratorsByChannelIdQuery, GetCollaboratorsByChannelIdQueryVariables>(
      GetCollaboratorsByChannelId,
      { channelId },
      'collaborators'
    )
  }

  public async getMembershipVerificationStatusUpdatedEvents(
    events: EventDetails[]
  ): Promise<MemberVerificationStatusUpdatedEventFieldsFragment[]> {
    const eventIds = events.map((e) => this.getQueryNodeEventId(e.blockNumber, e.indexInBlock))
    return this.multipleEntitiesQuery<
      GetMemberVerificationStatusUpdatedEventsByEventIdsQuery,
      GetMemberVerificationStatusUpdatedEventsByEventIdsQueryVariables
    >(GetMemberVerificationStatusUpdatedEventsByEventIds, { eventIds }, 'memberVerificationStatusUpdatedEvents')
  }

  public async videoById(videoId: string): Promise<VideoFieldsFragment | null> {
    return this.uniqueEntityQuery<GetVideoByIdQuery, GetVideoByIdQueryVariables>(
      GetVideoById,
      { videoId },
      'videoByUniqueInput'
    )
  }

  public async getVideosByIds(ids: string[]): Promise<VideoFieldsFragment[]> {
    return this.multipleEntitiesQuery<GetVideosByIdsQuery, GetVideosByIdsQueryVariables>(
      GetVideosByIds,
      { ids },
      'videos'
    )
  }

  public async getCommentsByIds(ids: string[]): Promise<CommentFieldsFragment[]> {
    return this.multipleEntitiesQuery<GetCommentsByIdsQuery, GetCommentsByIdsQueryVariables>(
      GetCommentsByIds,
      { ids: ids.map((id) => id.toString()) },
      'comments'
    )
  }

  public async getCommentCreatedEvents(events: EventDetails[]): Promise<CommentCreatedEventFieldsFragment[]> {
    const eventIds = events.map((e) => this.getQueryNodeEventId(e.blockNumber, e.indexInBlock))
    return this.multipleEntitiesQuery<
      GetCommentCreatedEventsByEventIdsQuery,
      GetCommentCreatedEventsByEventIdsQueryVariables
    >(GetCommentCreatedEventsByEventIds, { eventIds }, 'commentCreatedEvents')
  }

  public async getCommentEditedEvents(events: EventDetails[]): Promise<CommentTextUpdatedEventFieldsFragment[]> {
    const eventIds = events.map((e) => this.getQueryNodeEventId(e.blockNumber, e.indexInBlock))
    return this.multipleEntitiesQuery<
      GetCommentEditedEventsByEventIdsQuery,
      GetCommentEditedEventsByEventIdsQueryVariables
    >(GetCommentEditedEventsByEventIds, { eventIds }, 'commentTextUpdatedEvents')
  }

  public async getCommentDeletedEvents(events: EventDetails[]): Promise<CommentDeletedEventFieldsFragment[]> {
    const eventIds = events.map((e) => this.getQueryNodeEventId(e.blockNumber, e.indexInBlock))
    return this.multipleEntitiesQuery<
      GetCommentDeletedEventsByEventIdsQuery,
      GetCommentDeletedEventsByEventIdsQueryVariables
    >(GetCommentDeletedEventsByEventIds, { eventIds }, 'commentDeletedEvents')
  }

  public async getCommentModeratedEvents(events: EventDetails[]): Promise<CommentModeratedEventFieldsFragment[]> {
    const eventIds = events.map((e) => this.getQueryNodeEventId(e.blockNumber, e.indexInBlock))
    return this.multipleEntitiesQuery<
      GetCommentModeratedEventsByEventIdsQuery,
      GetCommentModeratedEventsByEventIdsQueryVariables
    >(GetCommentModeratedEventsByEventIds, { eventIds }, 'commentModeratedEvents')
  }

  public async getVideoReactedEvents(events: EventDetails[]): Promise<VideoReactedEventFieldsFragment[]> {
    const eventIds = events.map((e) => this.getQueryNodeEventId(e.blockNumber, e.indexInBlock))
    return this.multipleEntitiesQuery<
      GetVideoReactedEventsByEventIdsQuery,
      GetVideoReactedEventsByEventIdsQueryVariables
    >(GetVideoReactedEventsByEventIds, { eventIds }, 'videoReactedEvents')
  }

  public async getCommentReactedEvents(events: EventDetails[]): Promise<CommentReactedEventFieldsFragment[]> {
    const eventIds = events.map((e) => this.getQueryNodeEventId(e.blockNumber, e.indexInBlock))
    return this.multipleEntitiesQuery<
      GetCommentReactedEventsByEventIdsQuery,
      GetCommentReactedEventsByEventIdsQueryVariables
    >(GetCommentReactedEventsByEventIds, { eventIds }, 'commentReactedEvents')
  }

  public async getCommentPinnedEvents(events: EventDetails[]): Promise<CommentPinnedEventFieldsFragment[]> {
    const eventIds = events.map((e) => this.getQueryNodeEventId(e.blockNumber, e.indexInBlock))
    return this.multipleEntitiesQuery<
      GetCommentPinnedEventsByEventIdsQuery,
      GetCommentPinnedEventsByEventIdsQueryVariables
    >(GetCommentPinnedEventsByEventIds, { eventIds }, 'commentPinnedEvents')
  }

  public async getMemberBannedFromChannelEvents(
    events: EventDetails[]
  ): Promise<MemberBannedFromChannelEventFieldsFragment[]> {
    const eventIds = events.map((e) => this.getQueryNodeEventId(e.blockNumber, e.indexInBlock))
    return this.multipleEntitiesQuery<
      GetMemberBannedFromChannelEventsByEventIdsQuery,
      GetMemberBannedFromChannelEventsByEventIdsQueryVariables
    >(GetMemberBannedFromChannelEventsByEventIds, { eventIds }, 'memberBannedFromChannelEvents')
  }

  public async getVideoReactionsPreferenceEvents(
    events: EventDetails[]
  ): Promise<VideoReactionsPreferenceEventFieldsFragment[]> {
    const eventIds = events.map((e) => this.getQueryNodeEventId(e.blockNumber, e.indexInBlock))
    return this.multipleEntitiesQuery<
      GetVideoReactionsPreferenceEventsByEventIdsQuery,
      GetVideoReactionsPreferenceEventsByEventIdsQueryVariables
    >(GetVideoReactionsPreferenceEventsByEventIds, { eventIds }, 'videoReactionsPreferenceEvents')
  }

  public async getEnglishAuctionStartedEvents(
    events: EventDetails[]
  ): Promise<EnglishAuctionStartedEventFieldsFragment[]> {
    const eventIds = events.map((e) => this.getQueryNodeEventId(e.blockNumber, e.indexInBlock))
    return this.multipleEntitiesQuery<
      GetEnglishAuctionStartedEventsByEventIdsQuery,
      GetEnglishAuctionStartedEventsByEventIdsQueryVariables
    >(GetEnglishAuctionStartedEventsByEventIds, { eventIds }, 'englishAuctionStartedEvents')
  }

  public async getNftIssuedEvents(events: EventDetails[]): Promise<NftIssuedEventFieldsFragment[]> {
    const eventIds = events.map((e) => this.getQueryNodeEventId(e.blockNumber, e.indexInBlock))
    return this.multipleEntitiesQuery<GetNftIssuedEventsByEventIdsQuery, GetNftIssuedEventsByEventIdsQueryVariables>(
      GetNftIssuedEventsByEventIds,
      { eventIds },
      'nftIssuedEvents'
    )
  }

  public async getEnglishAuctionSettledEvents(
    events: EventDetails[]
  ): Promise<EnglishAuctionSettledEventFieldsFragment[]> {
    const eventIds = events.map((e) => this.getQueryNodeEventId(e.blockNumber, e.indexInBlock))
    return this.multipleEntitiesQuery<
      GetEnglishAuctionSettledEventsByEventIdsQuery,
      GetEnglishAuctionSettledEventsByEventIdsQueryVariables
    >(GetEnglishAuctionSettledEventsByEventIds, { eventIds }, 'englishAuctionSettledEvents')
  }

  public async getChannelAssetsDeletedByModeratorEvents(
    events: EventDetails[]
  ): Promise<ChannelAssetsDeletedByModeratorEventFieldsFragment[]> {
    const eventIds = events.map((e) => this.getQueryNodeEventId(e.blockNumber, e.indexInBlock))
    return this.multipleEntitiesQuery<
      GetChannelAssetsDeletedByModeratorEventsByEventIdsQuery,
      GetChannelAssetsDeletedByModeratorEventsByEventIdsQueryVariables
    >(GetChannelAssetsDeletedByModeratorEventsByEventIds, { eventIds }, 'channelAssetsDeletedByModeratorEvents')
  }

  public async getVideoAssetsDeletedByModeratorEvents(
    events: EventDetails[]
  ): Promise<VideoAssetsDeletedByModeratorEventFieldsFragment[]> {
    const eventIds = events.map((e) => this.getQueryNodeEventId(e.blockNumber, e.indexInBlock))
    return this.multipleEntitiesQuery<
      GetVideoAssetsDeletedByModeratorEventsByEventIdsQuery,
      GetVideoAssetsDeletedByModeratorEventsByEventIdsQueryVariables
    >(GetVideoAssetsDeletedByModeratorEventsByEventIds, { eventIds }, 'videoAssetsDeletedByModeratorEvents')
  }

  public async getVideoVisibilitySetByModeratorEvents(
    events: EventDetails[]
  ): Promise<VideoVisibilitySetByModeratorEventFieldsFragment[]> {
    const eventIds = events.map((e) => this.getQueryNodeEventId(e.blockNumber, e.indexInBlock))
    return this.multipleEntitiesQuery<
      GetVideoVisibilitySetByModeratorEventsByEventIdsQuery,
      GetVideoVisibilitySetByModeratorEventsByEventIdsQueryVariables
    >(GetVideoAssetsDeletedByModeratorEventsByEventIds, { eventIds }, 'videoVisibilitySetByModeratorEvents')
  }

  async storageNodesInfoByBagId(bagId: string): Promise<StorageNodeInfoFragment[]> {
    return this.multipleEntitiesQuery<GetStorageNodesInfoByBagIdQuery, GetStorageNodesInfoByBagIdQueryVariables>(
      GetStorageNodesInfoByBagId,
      { bagId },
      'storageBuckets'
    )
  }

  async storageBucketsForNewChannel(): Promise<StorageNodeInfoFragment[]> {
    return this.multipleEntitiesQuery<GetStorageBucketsQuery, GetStorageBucketsQueryVariables>(
      GetStorageBuckets,
      {},
      'storageBuckets'
    )
  }

  async distributionBucketsForNewChannel(): Promise<DistributionBucketFamilyFieldsFragment[]> {
    return this.multipleEntitiesQuery<
      GetDistributionFamiliesAdndBucketsQuery,
      GetDistributionFamiliesAdndBucketsQueryVariables
    >(GetDistributionFamiliesAdndBuckets, {}, 'distributionBucketFamilies')
  }

  async mostRecentChannelPayoutsUpdatedEvent(): Promise<ChannelPayoutsUpdatedEventFragment[]> {
    return this.multipleEntitiesQuery<
      GetMostRecentChannelPayoutsUpdatedEventQuery,
      GetMostRecentChannelPayoutsUpdatedEventQueryVariables
    >(GetMostRecentChannelPayoutsUpdatedEvent, {}, 'channelPayoutsUpdatedEvents')
  }

  public async getChannelRewardClaimedEvents(
    events: EventDetails[]
  ): Promise<ChannelRewardClaimedEventFieldsFragment[]> {
    const eventIds = events.map((e) => this.getQueryNodeEventId(e.blockNumber, e.indexInBlock))
    return this.multipleEntitiesQuery<
      GetChannelRewardClaimedEventsByEventIdsQuery,
      GetChannelRewardClaimedEventsByEventIdsQueryVariables
    >(GetChannelRewardClaimedEventsByEventIds, { eventIds }, 'channelRewardClaimedEvents')
  }

  public async getChannelRewardClaimedAndWithdrawnEvents(
    events: EventDetails[]
  ): Promise<ChannelRewardClaimedAndWithdrawnEventFieldsFragment[]> {
    const eventIds = events.map((e) => this.getQueryNodeEventId(e.blockNumber, e.indexInBlock))
    return this.multipleEntitiesQuery<
      GetChannelRewardClaimedAndWithdrawnEventsByEventIdsQuery,
      GetChannelRewardClaimedAndWithdrawnEventsByEventIdsQueryVariables
    >(GetChannelRewardClaimedAndWithdrawnEventsByEventIds, { eventIds }, 'channelRewardClaimedAndWithdrawnEvents')
  }

  public async getChannelFundsWithdrawnEvents(
    events: EventDetails[]
  ): Promise<ChannelFundsWithdrawnEventFieldsFragment[]> {
    const eventIds = events.map((e) => this.getQueryNodeEventId(e.blockNumber, e.indexInBlock))
    return this.multipleEntitiesQuery<
      GetChannelFundsWithdrawnEventsByEventIdsQuery,
      GetChannelFundsWithdrawnEventsByEventIdsQueryVariables
    >(GetChannelFundsWithdrawnEventsByEventIds, { eventIds }, 'channelFundsWithdrawnEvents')
  }

  public async getChannelPaymentMadeEvents(events: EventDetails[]): Promise<ChannelPaymentMadeEventFieldsFragment[]> {
    const eventIds = events.map((e) => this.getQueryNodeEventId(e.blockNumber, e.indexInBlock))
    return this.multipleEntitiesQuery<
      GetChannelPaymentMadeEventsByEventIdsQuery,
      GetChannelPaymentMadeEventsByEventIdsQueryVariables
    >(GetChannelPaymentMadeEventsByEventIds, { eventIds }, 'channelPaymentMadeEvents')
  }

  public async getMetaprotocolTransactionEvents(
    events: EventDetails[]
  ): Promise<MetaprotocolTransactionStatusEventFieldsFragment[]> {
    const eventIds = events.map((e) => this.getQueryNodeEventId(e.blockNumber, e.indexInBlock))
    return this.multipleEntitiesQuery<
      GetMetaprotocolTransactionalStatusEventsByEventIdsQuery,
      GetMetaprotocolTransactionalStatusEventsByEventIdsQueryVariables
    >(GetMetaprotocolTransactionalStatusEventsByEventIds, { eventIds }, 'metaprotocolTransactionStatusEvents')
  }

  public async getAppById(id: string): Promise<AppFieldsFragment | null> {
    return this.uniqueEntityQuery<GetAppByIdQuery, GetAppByIdQueryVariables>(GetAppById, { id }, 'appByUniqueInput')
  }

  public async getAppsByName(name: string): Promise<AppFieldsFragment[] | null> {
    return this.multipleEntitiesQuery<GetAppsByNameQuery, GetAppsByNameQueryVariables>(GetAppsByName, { name }, 'apps')
  }

  async getChannelsCount(): Promise<number> {
    const result = await this.uniqueEntityQuery<GetChannelsCountQuery, GetChannelsCountQueryVariables>(
      GetChannelsCount,
      {},
      'channelsConnection'
    )
    Utils.assert(result)
    return result.totalCount
  }
}
