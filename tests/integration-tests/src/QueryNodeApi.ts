import { ApolloClient, DocumentNode, NormalizedCacheObject } from '@apollo/client'
import { MemberId } from '@joystream/types/common'
import Debugger from 'debug'
import { ApplicationId, OpeningId } from '@joystream/types/working-group'
import { WorkingGroupModuleName } from './types'
import {
  GetMemberByIdQuery,
  GetMemberByIdQueryVariables,
  GetMemberById,
  GetMembershipBoughtEventsByMemberIdQuery,
  GetMembershipBoughtEventsByMemberIdQueryVariables,
  GetMembershipBoughtEventsByMemberId,
  GetMemberProfileUpdatedEventsByMemberIdQuery,
  GetMemberProfileUpdatedEventsByMemberIdQueryVariables,
  GetMemberProfileUpdatedEventsByMemberId,
  GetMemberAccountsUpdatedEventsByMemberIdQuery,
  GetMemberAccountsUpdatedEventsByMemberIdQueryVariables,
  GetMemberAccountsUpdatedEventsByMemberId,
  GetMemberInvitedEventsByNewMemberIdQuery,
  GetMemberInvitedEventsByNewMemberIdQueryVariables,
  GetMemberInvitedEventsByNewMemberId,
  GetInvitesTransferredEventsBySourceMemberIdQuery,
  GetInvitesTransferredEventsBySourceMemberIdQueryVariables,
  GetInvitesTransferredEventsBySourceMemberId,
  GetStakingAccountAddedEventsByMemberIdQuery,
  GetStakingAccountAddedEventsByMemberIdQueryVariables,
  GetStakingAccountAddedEventsByMemberId,
  GetStakingAccountConfirmedEventsByMemberIdQuery,
  GetStakingAccountConfirmedEventsByMemberIdQueryVariables,
  GetStakingAccountConfirmedEventsByMemberId,
  GetStakingAccountRemovedEventsByMemberIdQuery,
  GetStakingAccountRemovedEventsByMemberIdQueryVariables,
  GetStakingAccountRemovedEventsByMemberId,
  GetMembershipSystemSnapshotAtQuery,
  GetMembershipSystemSnapshotAtQueryVariables,
  GetMembershipSystemSnapshotAt,
  GetMembershipSystemSnapshotBeforeQuery,
  GetMembershipSystemSnapshotBeforeQueryVariables,
  GetMembershipSystemSnapshotBefore,
  GetReferralCutUpdatedEventsByEventIdQuery,
  GetReferralCutUpdatedEventsByEventIdQueryVariables,
  GetReferralCutUpdatedEventsByEventId,
  GetMembershipPriceUpdatedEventsByEventIdQuery,
  GetMembershipPriceUpdatedEventsByEventIdQueryVariables,
  GetMembershipPriceUpdatedEventsByEventId,
  GetInitialInvitationBalanceUpdatedEventsByEventIdQuery,
  GetInitialInvitationBalanceUpdatedEventsByEventIdQueryVariables,
  GetInitialInvitationBalanceUpdatedEventsByEventId,
  GetInitialInvitationCountUpdatedEventsByEventIdQuery,
  GetInitialInvitationCountUpdatedEventsByEventIdQueryVariables,
  GetInitialInvitationCountUpdatedEventsByEventId,
  GetOpeningByIdQuery,
  GetOpeningByIdQueryVariables,
  GetOpeningById,
  GetApplicationByIdQuery,
  GetApplicationByIdQueryVariables,
  GetApplicationById,
  GetAppliedOnOpeningEventsByEventIdQuery,
  GetAppliedOnOpeningEventsByEventIdQueryVariables,
  GetAppliedOnOpeningEventsByEventId,
  GetOpeningAddedEventsByEventIdQuery,
  GetOpeningAddedEventsByEventIdQueryVariables,
  GetOpeningAddedEventsByEventId,
  GetOpeningFilledEventsByEventIdQuery,
  GetOpeningFilledEventsByEventIdQueryVariables,
  GetOpeningFilledEventsByEventId,
  GetApplicationWithdrawnEventsByEventIdQuery,
  GetApplicationWithdrawnEventsByEventIdQueryVariables,
  GetApplicationWithdrawnEventsByEventId,
  GetOpeningCancelledEventsByEventIdQuery,
  GetOpeningCancelledEventsByEventIdQueryVariables,
  GetOpeningCancelledEventsByEventId,
  GetStatusTextChangedEventsByEventIdQuery,
  GetStatusTextChangedEventsByEventIdQueryVariables,
  GetStatusTextChangedEventsByEventId,
  GetUpcomingOpeningByCreatedInEventIdQuery,
  GetUpcomingOpeningByCreatedInEventIdQueryVariables,
  GetUpcomingOpeningByCreatedInEventId,
  GetWorkingGroupByNameQuery,
  GetWorkingGroupByNameQueryVariables,
  GetWorkingGroupByName,
  GetWorkingGroupMetadataSnapshotAtQuery,
  GetWorkingGroupMetadataSnapshotAtQueryVariables,
  GetWorkingGroupMetadataSnapshotAt,
  GetWorkingGroupMetadataSnapshotBeforeQuery,
  GetWorkingGroupMetadataSnapshotBeforeQueryVariables,
  GetWorkingGroupMetadataSnapshotBefore,
  MembershipFieldsFragment,
  MembershipBoughtEventFieldsFragment,
  MemberProfileUpdatedEventFieldsFragment,
  MemberAccountsUpdatedEventFieldsFragment,
  MemberInvitedEventFieldsFragment,
  InvitesTransferredEventFieldsFragment,
  StakingAccountAddedEventFieldsFragment,
  StakingAccountConfirmedEventFieldsFragment,
  StakingAccountRemovedEventFieldsFragment,
  MembershipSystemSnapshotFieldsFragment,
  ReferralCutUpdatedEventFieldsFragment,
  MembershipPriceUpdatedEventFieldsFragment,
  InitialInvitationBalanceUpdatedEventFieldsFragment,
  InitialInvitationCountUpdatedEventFieldsFragment,
  OpeningFieldsFragment,
  ApplicationFieldsFragment,
  AppliedOnOpeningEventFieldsFragment,
  OpeningAddedEventFieldsFragment,
  OpeningFilledEventFieldsFragment,
  ApplicationWithdrawnEventFieldsFragment,
  OpeningCanceledEventFieldsFragment,
  StatusTextChangedEventFieldsFragment,
  UpcomingOpeningFieldsFragment,
  WorkingGroupFieldsFragment,
  WorkingGroupMetadataFieldsFragment,
} from './graphql/generated/queries'
import { Maybe } from './graphql/generated/schema'
import { OperationDefinitionNode } from 'graphql'
export class QueryNodeApi {
  private readonly queryNodeProvider: ApolloClient<NormalizedCacheObject>
  private readonly debug: Debugger.Debugger
  private readonly queryDebug: Debugger.Debugger
  private readonly tryDebug: Debugger.Debugger

  constructor(queryNodeProvider: ApolloClient<NormalizedCacheObject>) {
    this.queryNodeProvider = queryNodeProvider
    this.debug = Debugger('query-node-api')
    this.queryDebug = this.debug.extend('query')
    this.tryDebug = this.debug.extend('try')
  }

  public tryQueryWithTimeout<QueryResultT>(
    query: () => Promise<QueryResultT>,
    assertResultIsValid: (res: QueryResultT) => void,
    timeoutMs = 210000,
    retryTimeMs = 30000
  ): Promise<QueryResultT> {
    const label = query.toString().replace(/^.*\.([A-za-z0-9]+\(.*\))$/g, '$1')
    const retryDebug = this.tryDebug.extend(label).extend('retry')
    const failDebug = this.tryDebug.extend(label).extend('failed')
    return new Promise((resolve, reject) => {
      let lastError: any
      const timeout = setTimeout(() => {
        failDebug(`Query node query is still failing after timeout was reached (${timeoutMs}ms)!`)
        reject(lastError)
      }, timeoutMs)
      const tryQuery = () => {
        query()
          .then((result) => {
            try {
              assertResultIsValid(result)
              clearTimeout(timeout)
              resolve(result)
            } catch (e) {
              retryDebug(
                `Unexpected query result${
                  e && e.message ? ` (${e.message})` : ''
                }, retyring query in ${retryTimeMs}ms...`
              )
              lastError = e
              setTimeout(tryQuery, retryTimeMs)
            }
          })
          .catch((e) => {
            retryDebug(`Query node unreachable, retyring query in ${retryTimeMs}ms...`)
            lastError = e
            setTimeout(tryQuery, retryTimeMs)
          })
      }

      tryQuery()
    })
  }

  private debugQuery(query: DocumentNode, args: Record<string, unknown>): void {
    const queryDef = query.definitions.find((d) => d.kind === 'OperationDefinition') as OperationDefinitionNode
    this.queryDebug(`${queryDef.name!.value}(${JSON.stringify(args)})`)
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
    return `${blockNumber}-${indexInBlock}`
  }

  public async getMemberById(id: MemberId): Promise<MembershipFieldsFragment | null> {
    return this.uniqueEntityQuery<GetMemberByIdQuery, GetMemberByIdQueryVariables>(
      GetMemberById,
      { id: id.toString() },
      'membershipByUniqueInput'
    )
  }

  public async getMembershipBoughtEvent(memberId: MemberId): Promise<MembershipBoughtEventFieldsFragment | null> {
    return this.firstEntityQuery<
      GetMembershipBoughtEventsByMemberIdQuery,
      GetMembershipBoughtEventsByMemberIdQueryVariables
    >(GetMembershipBoughtEventsByMemberId, { memberId: memberId.toString() }, 'membershipBoughtEvents')
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

  public async getMemberInvitedEvent(memberId: MemberId): Promise<MemberInvitedEventFieldsFragment | null> {
    return this.firstEntityQuery<
      GetMemberInvitedEventsByNewMemberIdQuery,
      GetMemberInvitedEventsByNewMemberIdQueryVariables
    >(GetMemberInvitedEventsByNewMemberId, { newMemberId: memberId.toString() }, 'memberInvitedEvents')
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

  public async getStakingAccountAddedEvents(memberId: MemberId): Promise<StakingAccountAddedEventFieldsFragment[]> {
    return this.multipleEntitiesQuery<
      GetStakingAccountAddedEventsByMemberIdQuery,
      GetStakingAccountAddedEventsByMemberIdQueryVariables
    >(GetStakingAccountAddedEventsByMemberId, { memberId: memberId.toString() }, 'stakingAccountAddedEvents')
  }

  public async getStakingAccountConfirmedEvents(
    memberId: MemberId
  ): Promise<StakingAccountConfirmedEventFieldsFragment[]> {
    return this.multipleEntitiesQuery<
      GetStakingAccountConfirmedEventsByMemberIdQuery,
      GetStakingAccountConfirmedEventsByMemberIdQueryVariables
    >(GetStakingAccountConfirmedEventsByMemberId, { memberId: memberId.toString() }, 'stakingAccountConfirmedEvents')
  }

  public async getStakingAccountRemovedEvents(memberId: MemberId): Promise<StakingAccountRemovedEventFieldsFragment[]> {
    return this.multipleEntitiesQuery<
      GetStakingAccountRemovedEventsByMemberIdQuery,
      GetStakingAccountRemovedEventsByMemberIdQueryVariables
    >(GetStakingAccountRemovedEventsByMemberId, { memberId: memberId.toString() }, 'stakingAccountRemovedEvents')
  }

  // FIXME: Cross-filtering is not enabled yet, so we have to use timestamp workaround
  public async getMembershipSystemSnapshotAt(
    timestamp: number
  ): Promise<MembershipSystemSnapshotFieldsFragment | null> {
    return this.firstEntityQuery<GetMembershipSystemSnapshotAtQuery, GetMembershipSystemSnapshotAtQueryVariables>(
      GetMembershipSystemSnapshotAt,
      { time: new Date(timestamp) },
      'membershipSystemSnapshots'
    )
  }

  public async getMembershipSystemSnapshotBefore(
    timestamp: number
  ): Promise<MembershipSystemSnapshotFieldsFragment | null> {
    return this.firstEntityQuery<
      GetMembershipSystemSnapshotBeforeQuery,
      GetMembershipSystemSnapshotBeforeQueryVariables
    >(GetMembershipSystemSnapshotBefore, { time: new Date(timestamp) }, 'membershipSystemSnapshots')
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

  public async getAppliedOnOpeningEvent(
    blockNumber: number,
    indexInBlock: number
  ): Promise<AppliedOnOpeningEventFieldsFragment | null> {
    return this.firstEntityQuery<
      GetAppliedOnOpeningEventsByEventIdQuery,
      GetAppliedOnOpeningEventsByEventIdQueryVariables
    >(
      GetAppliedOnOpeningEventsByEventId,
      { eventId: this.getQueryNodeEventId(blockNumber, indexInBlock) },
      'appliedOnOpeningEvents'
    )
  }

  public async getOpeningAddedEvent(
    blockNumber: number,
    indexInBlock: number
  ): Promise<OpeningAddedEventFieldsFragment | null> {
    return this.firstEntityQuery<GetOpeningAddedEventsByEventIdQuery, GetOpeningAddedEventsByEventIdQueryVariables>(
      GetOpeningAddedEventsByEventId,
      { eventId: this.getQueryNodeEventId(blockNumber, indexInBlock) },
      'openingAddedEvents'
    )
  }

  public async getOpeningFilledEvent(
    blockNumber: number,
    indexInBlock: number
  ): Promise<OpeningFilledEventFieldsFragment | null> {
    return this.firstEntityQuery<GetOpeningFilledEventsByEventIdQuery, GetOpeningFilledEventsByEventIdQueryVariables>(
      GetOpeningFilledEventsByEventId,
      { eventId: this.getQueryNodeEventId(blockNumber, indexInBlock) },
      'openingFilledEvents'
    )
  }

  public async getApplicationWithdrawnEvent(
    blockNumber: number,
    indexInBlock: number
  ): Promise<ApplicationWithdrawnEventFieldsFragment | null> {
    return this.firstEntityQuery<
      GetApplicationWithdrawnEventsByEventIdQuery,
      GetApplicationWithdrawnEventsByEventIdQueryVariables
    >(
      GetApplicationWithdrawnEventsByEventId,
      { eventId: this.getQueryNodeEventId(blockNumber, indexInBlock) },
      'applicationWithdrawnEvents'
    )
  }

  public async getOpeningCancelledEvent(
    blockNumber: number,
    indexInBlock: number
  ): Promise<OpeningCanceledEventFieldsFragment | null> {
    return this.firstEntityQuery<
      GetOpeningCancelledEventsByEventIdQuery,
      GetOpeningCancelledEventsByEventIdQueryVariables
    >(
      GetOpeningCancelledEventsByEventId,
      { eventId: this.getQueryNodeEventId(blockNumber, indexInBlock) },
      'openingCanceledEvents'
    )
  }

  public async getStatusTextChangedEvent(
    blockNumber: number,
    indexInBlock: number
  ): Promise<StatusTextChangedEventFieldsFragment | null> {
    return this.firstEntityQuery<
      GetStatusTextChangedEventsByEventIdQuery,
      GetStatusTextChangedEventsByEventIdQueryVariables
    >(
      GetStatusTextChangedEventsByEventId,
      { eventId: this.getQueryNodeEventId(blockNumber, indexInBlock) },
      'statusTextChangedEvents'
    )
  }

  public async getUpcomingOpeningByCreatedInEventId(eventId: string): Promise<UpcomingOpeningFieldsFragment | null> {
    return this.firstEntityQuery<
      GetUpcomingOpeningByCreatedInEventIdQuery,
      GetUpcomingOpeningByCreatedInEventIdQueryVariables
    >(GetUpcomingOpeningByCreatedInEventId, { createdInEventId: eventId }, 'upcomingWorkingGroupOpenings')
  }

  public async getWorkingGroup(name: WorkingGroupModuleName): Promise<WorkingGroupFieldsFragment | null> {
    return this.uniqueEntityQuery<GetWorkingGroupByNameQuery, GetWorkingGroupByNameQueryVariables>(
      GetWorkingGroupByName,
      { name },
      'workingGroupByUniqueInput'
    )
  }

  // FIXME: Use blockheights once possible
  public async getGroupMetaSnapshotAt(
    groupId: string,
    timestamp: number
  ): Promise<WorkingGroupMetadataFieldsFragment | null> {
    return this.firstEntityQuery<
      GetWorkingGroupMetadataSnapshotAtQuery,
      GetWorkingGroupMetadataSnapshotAtQueryVariables
    >(GetWorkingGroupMetadataSnapshotAt, { groupId, timestamp: new Date(timestamp) }, 'workingGroupMetadata')
  }

  public async getGroupMetaSnapshotBefore(
    groupId: string,
    timestamp: number
  ): Promise<WorkingGroupMetadataFieldsFragment | null> {
    return this.firstEntityQuery<
      GetWorkingGroupMetadataSnapshotBeforeQuery,
      GetWorkingGroupMetadataSnapshotBeforeQueryVariables
    >(GetWorkingGroupMetadataSnapshotBefore, { groupId, timestamp: new Date(timestamp) }, 'workingGroupMetadata')
  }
}
