import { gql, ApolloClient, ApolloQueryResult, NormalizedCacheObject } from '@apollo/client'
import { MemberId } from '@joystream/types/common'
import {
  AppliedOnOpeningEvent,
  InitialInvitationBalanceUpdatedEvent,
  InitialInvitationCountUpdatedEvent,
  MembershipPriceUpdatedEvent,
  MembershipSystemSnapshot,
  OpeningAddedEvent,
  OpeningFilledEvent,
  Query,
  ReferralCutUpdatedEvent,
} from './QueryNodeApiSchema.generated'
import Debugger from 'debug'
import { ApplicationId, OpeningId } from '@joystream/types/working-group'

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

  public async getMemberById(id: MemberId): Promise<ApolloQueryResult<Pick<Query, 'membershipByUniqueInput'>>> {
    const MEMBER_BY_ID_QUERY = gql`
      query($id: ID!) {
        membershipByUniqueInput(where: { id: $id }) {
          id
          handle
          metadata {
            name
            about
          }
          controllerAccount
          rootAccount
          registeredAtBlock
          registeredAtTime
          entry
          isVerified
          inviteCount
          invitedBy {
            id
          }
          invitees {
            id
          }
          boundAccounts
        }
      }
    `

    this.queryDebug(`Executing getMemberById(${id.toString()}) query`)

    return this.queryNodeProvider.query({ query: MEMBER_BY_ID_QUERY, variables: { id: id.toNumber() } })
  }

  public async getMembershipBoughtEvents(
    memberId: MemberId
  ): Promise<ApolloQueryResult<Pick<Query, 'membershipBoughtEvents'>>> {
    const MEMBERTSHIP_BOUGHT_BY_MEMBER_ID = gql`
      query($memberId: ID!) {
        membershipBoughtEvents(where: { newMemberId_eq: $memberId }) {
          event {
            inBlock
            inExtrinsic
            indexInBlock
            type
          }
          newMember {
            id
          }
          rootAccount
          controllerAccount
          handle
          metadata {
            name
            about
          }
          referrer {
            id
          }
        }
      }
    `

    this.queryDebug(`Executing getMembershipBoughtEvents(${memberId.toString()})`)

    return this.queryNodeProvider.query({
      query: MEMBERTSHIP_BOUGHT_BY_MEMBER_ID,
      variables: { memberId: memberId.toNumber() },
    })
  }

  public async getMemberProfileUpdatedEvents(
    memberId: MemberId
  ): Promise<ApolloQueryResult<Pick<Query, 'memberProfileUpdatedEvents'>>> {
    const MEMBER_PROFILE_UPDATED_BY_MEMBER_ID = gql`
      query($memberId: ID!) {
        memberProfileUpdatedEvents(where: { memberId_eq: $memberId }) {
          event {
            inBlock
            inExtrinsic
            indexInBlock
            type
          }
          member {
            id
          }
          newHandle
          newMetadata {
            name
            about
          }
        }
      }
    `

    this.queryDebug(`Executing getMemberProfileUpdatedEvents(${memberId.toString()})`)

    return this.queryNodeProvider.query({
      query: MEMBER_PROFILE_UPDATED_BY_MEMBER_ID,
      variables: { memberId: memberId.toNumber() },
    })
  }

  public async getMemberAccountsUpdatedEvents(
    memberId: MemberId
  ): Promise<ApolloQueryResult<Pick<Query, 'memberAccountsUpdatedEvents'>>> {
    const MEMBER_ACCOUNTS_UPDATED_BY_MEMBER_ID = gql`
      query($memberId: ID!) {
        memberAccountsUpdatedEvents(where: { memberId_eq: $memberId }) {
          event {
            inBlock
            inExtrinsic
            indexInBlock
            type
          }
          member {
            id
          }
          newRootAccount
          newControllerAccount
        }
      }
    `

    this.queryDebug(`Executing getMemberAccountsUpdatedEvents(${memberId.toString()})`)

    return this.queryNodeProvider.query({
      query: MEMBER_ACCOUNTS_UPDATED_BY_MEMBER_ID,
      variables: { memberId: memberId.toNumber() },
    })
  }

  public async getMemberInvitedEvents(
    memberId: MemberId
  ): Promise<ApolloQueryResult<Pick<Query, 'memberInvitedEvents'>>> {
    const MEMBER_INVITED_BY_MEMBER_ID = gql`
      query($memberId: ID!) {
        memberInvitedEvents(where: { newMemberId_eq: $memberId }) {
          event {
            inBlock
            inExtrinsic
            indexInBlock
            type
          }
          invitingMember {
            id
          }
          newMember {
            id
          }
          rootAccount
          controllerAccount
          handle
          metadata {
            name
            about
          }
        }
      }
    `

    this.queryDebug(`Executing getMemberInvitedEvents(${memberId.toString()})`)

    return this.queryNodeProvider.query({
      query: MEMBER_INVITED_BY_MEMBER_ID,
      variables: { memberId: memberId.toNumber() },
    })
  }

  public async getInvitesTransferredEvents(
    fromMemberId: MemberId
  ): Promise<ApolloQueryResult<Pick<Query, 'invitesTransferredEvents'>>> {
    const INVITES_TRANSFERRED_BY_MEMBER_ID = gql`
      query($from: ID!) {
        invitesTransferredEvents(where: { sourceMemberId_eq: $from }) {
          event {
            inBlock
            inExtrinsic
            indexInBlock
            type
          }
          sourceMember {
            id
          }
          targetMember {
            id
          }
          numberOfInvites
        }
      }
    `

    this.queryDebug(`Executing getInvitesTransferredEvents(${fromMemberId.toString()})`)

    return this.queryNodeProvider.query({
      query: INVITES_TRANSFERRED_BY_MEMBER_ID,
      variables: { from: fromMemberId.toNumber() },
    })
  }

  public async getStakingAccountAddedEvents(
    memberId: MemberId
  ): Promise<ApolloQueryResult<Pick<Query, 'stakingAccountAddedEvents'>>> {
    const STAKING_ACCOUNT_ADDED_BY_MEMBER_ID = gql`
      query($memberId: ID!) {
        stakingAccountAddedEvents(where: { memberId_eq: $memberId }) {
          event {
            inBlock
            inExtrinsic
            indexInBlock
            type
          }
          member {
            id
          }
          account
        }
      }
    `

    this.queryDebug(`Executing getStakingAccountAddedEvents(${memberId.toString()})`)

    return this.queryNodeProvider.query({
      query: STAKING_ACCOUNT_ADDED_BY_MEMBER_ID,
      variables: { memberId: memberId.toNumber() },
    })
  }

  public async getStakingAccountConfirmedEvents(
    memberId: MemberId
  ): Promise<ApolloQueryResult<Pick<Query, 'stakingAccountConfirmedEvents'>>> {
    const STAKING_ACCOUNT_CONFIRMED_BY_MEMBER_ID = gql`
      query($memberId: ID!) {
        stakingAccountConfirmedEvents(where: { memberId_eq: $memberId }) {
          event {
            inBlock
            inExtrinsic
            indexInBlock
            type
          }
          member {
            id
          }
          account
        }
      }
    `

    this.queryDebug(`Executing getStakingAccountConfirmedEvents(${memberId.toString()})`)

    return this.queryNodeProvider.query({
      query: STAKING_ACCOUNT_CONFIRMED_BY_MEMBER_ID,
      variables: { memberId: memberId.toNumber() },
    })
  }

  public async getStakingAccountRemovedEvents(
    memberId: MemberId
  ): Promise<ApolloQueryResult<Pick<Query, 'stakingAccountRemovedEvents'>>> {
    const STAKING_ACCOUNT_REMOVED_BY_MEMBER_ID = gql`
      query($memberId: ID!) {
        stakingAccountRemovedEvents(where: { memberId_eq: $memberId }) {
          event {
            inBlock
            inExtrinsic
            indexInBlock
            type
          }
          member {
            id
          }
          account
        }
      }
    `

    this.queryDebug(`Executing getStakingAccountRemovedEvents(${memberId.toString()})`)

    return this.queryNodeProvider.query({
      query: STAKING_ACCOUNT_REMOVED_BY_MEMBER_ID,
      variables: { memberId: memberId.toNumber() },
    })
  }

  public async getMembershipSystemSnapshot(
    blockNumber: number,
    matchType: 'eq' | 'lt' | 'lte' | 'gt' | 'gte' = 'eq'
  ): Promise<MembershipSystemSnapshot | undefined> {
    const MEMBERSHIP_SYSTEM_SNAPSHOT_QUERY = gql`
      query($blockNumber: Int!) {
        membershipSystemSnapshots(where: { snapshotBlock_${matchType}: $blockNumber }, orderBy: snapshotBlock_DESC, limit: 1) {
          snapshotBlock,
          snapshotTime,
          referralCut,
          invitedInitialBalance,
          defaultInviteCount,
          membershipPrice
        }
      }
    `

    this.queryDebug(`Executing getMembershipSystemSnapshot(${matchType} ${blockNumber})`)

    return (
      await this.queryNodeProvider.query<Pick<Query, 'membershipSystemSnapshots'>>({
        query: MEMBERSHIP_SYSTEM_SNAPSHOT_QUERY,
        variables: { blockNumber },
      })
    ).data.membershipSystemSnapshots[0]
  }

  public async getReferralCutUpdatedEvent(
    blockNumber: number,
    indexInBlock: number
  ): Promise<ReferralCutUpdatedEvent | undefined> {
    const REFERRAL_CUT_UPDATED_BY_ID = gql`
      query($eventId: ID!) {
        referralCutUpdatedEvents(where: { eventId_eq: $eventId }) {
          event {
            inBlock
            inExtrinsic
            indexInBlock
            type
          }
          newValue
        }
      }
    `

    const eventId = `${blockNumber}-${indexInBlock}`
    this.queryDebug(`Executing getReferralCutUpdatedEvent(${eventId})`)

    return (
      await this.queryNodeProvider.query<Pick<Query, 'referralCutUpdatedEvents'>>({
        query: REFERRAL_CUT_UPDATED_BY_ID,
        variables: { eventId },
      })
    ).data.referralCutUpdatedEvents[0]
  }

  public async getMembershipPriceUpdatedEvent(
    blockNumber: number,
    indexInBlock: number
  ): Promise<MembershipPriceUpdatedEvent | undefined> {
    const MEMBERSHIP_PRICE_UPDATED_BY_ID = gql`
      query($eventId: ID!) {
        membershipPriceUpdatedEvents(where: { eventId_eq: $eventId }) {
          event {
            inBlock
            inExtrinsic
            indexInBlock
            type
          }
          newPrice
        }
      }
    `

    const eventId = `${blockNumber}-${indexInBlock}`
    this.queryDebug(`Executing getMembershipPriceUpdatedEvent(${eventId})`)

    return (
      await this.queryNodeProvider.query<Pick<Query, 'membershipPriceUpdatedEvents'>>({
        query: MEMBERSHIP_PRICE_UPDATED_BY_ID,
        variables: { eventId },
      })
    ).data.membershipPriceUpdatedEvents[0]
  }

  public async getInitialInvitationBalanceUpdatedEvent(
    blockNumber: number,
    indexInBlock: number
  ): Promise<InitialInvitationBalanceUpdatedEvent | undefined> {
    const INITIAL_INVITATION_BALANCE_UPDATED_BY_ID = gql`
      query($eventId: ID!) {
        initialInvitationBalanceUpdatedEvents(where: { eventId_eq: $eventId }) {
          event {
            inBlock
            inExtrinsic
            indexInBlock
            type
          }
          newInitialBalance
        }
      }
    `

    const eventId = `${blockNumber}-${indexInBlock}`
    this.queryDebug(`Executing getInitialInvitationBalanceUpdatedEvent(${eventId})`)

    return (
      await this.queryNodeProvider.query<Pick<Query, 'initialInvitationBalanceUpdatedEvents'>>({
        query: INITIAL_INVITATION_BALANCE_UPDATED_BY_ID,
        variables: { eventId },
      })
    ).data.initialInvitationBalanceUpdatedEvents[0]
  }

  public async getInitialInvitationCountUpdatedEvent(
    blockNumber: number,
    indexInBlock: number
  ): Promise<InitialInvitationCountUpdatedEvent | undefined> {
    const INITIAL_INVITATION_COUNT_UPDATED_BY_ID = gql`
      query($eventId: ID!) {
        initialInvitationCountUpdatedEvents(where: { eventId_eq: $eventId }) {
          event {
            inBlock
            inExtrinsic
            indexInBlock
            type
          }
          newInitialInvitationCount
        }
      }
    `

    const eventId = `${blockNumber}-${indexInBlock}`
    this.queryDebug(`Executing getInitialInvitationCountUpdatedEvent(${eventId})`)

    return (
      await this.queryNodeProvider.query<Pick<Query, 'initialInvitationCountUpdatedEvents'>>({
        query: INITIAL_INVITATION_COUNT_UPDATED_BY_ID,
        variables: { eventId },
      })
    ).data.initialInvitationCountUpdatedEvents[0]
  }

  public async getOpeningById(
    id: OpeningId
  ): Promise<ApolloQueryResult<Pick<Query, 'workingGroupOpeningByUniqueInput'>>> {
    const OPENING_BY_ID = gql`
      query($openingId: ID!) {
        workingGroupOpeningByUniqueInput(where: { id: $openingId }) {
          id
          group {
            name
          }
          applications {
            id
            status {
              __typename
            }
          }
          type
          status {
            __typename
          }
          metadata {
            shortDescription
            description
            hiringLimit
            expectedEnding
            applicationDetails
            applicationFormQuestions {
              question
              type
              index
            }
          }
          stakeAmount
          unstakingPeriod
          rewardPerBlock
          createdAtBlock
          createdAt
        }
      }
    `

    this.queryDebug(`Executing getOpeningById(${id.toString()})`)

    return this.queryNodeProvider.query<Pick<Query, 'workingGroupOpeningByUniqueInput'>>({
      query: OPENING_BY_ID,
      variables: { openingId: id.toString() },
    })
  }

  public async getApplicationById(
    id: ApplicationId
  ): Promise<ApolloQueryResult<Pick<Query, 'workingGroupApplicationByUniqueInput'>>> {
    const APPLICATION_BY_ID = gql`
      query($applicationId: ID!) {
        workingGroupApplicationByUniqueInput(where: { id: $applicationId }) {
          id
          createdAtBlock
          createdAt
          opening {
            id
          }
          applicant {
            id
          }
          roleAccount
          rewardAccount
          stakingAccount
          status {
            __typename
          }
          answers {
            question {
              question
            }
            answer
          }
          stake
        }
      }
    `

    this.queryDebug(`Executing getApplicationById(${id.toString()})`)

    return this.queryNodeProvider.query<Pick<Query, 'workingGroupApplicationByUniqueInput'>>({
      query: APPLICATION_BY_ID,
      variables: { applicationId: id.toString() },
    })
  }

  public async getAppliedOnOpeningEvent(
    blockNumber: number,
    indexInBlock: number
  ): Promise<AppliedOnOpeningEvent | undefined> {
    const APPLIED_ON_OPENING_BY_ID = gql`
      query($eventId: ID!) {
        appliedOnOpeningEvents(where: { eventId_eq: $eventId }) {
          event {
            inBlock
            inExtrinsic
            indexInBlock
            type
          }
          group {
            name
          }
          opening {
            id
          }
          application {
            id
          }
        }
      }
    `

    const eventId = `${blockNumber}-${indexInBlock}`
    this.queryDebug(`Executing getAppliedOnOpeningEvent(${eventId})`)

    return (
      await this.queryNodeProvider.query<Pick<Query, 'appliedOnOpeningEvents'>>({
        query: APPLIED_ON_OPENING_BY_ID,
        variables: { eventId },
      })
    ).data.appliedOnOpeningEvents[0]
  }

  public async getOpeningAddedEvent(blockNumber: number, indexInBlock: number): Promise<OpeningAddedEvent | undefined> {
    const OPENING_ADDED_BY_ID = gql`
      query($eventId: ID!) {
        openingAddedEvents(where: { eventId_eq: $eventId }) {
          event {
            inBlock
            inExtrinsic
            indexInBlock
            type
          }
          group {
            name
          }
          opening {
            id
          }
        }
      }
    `

    const eventId = `${blockNumber}-${indexInBlock}`
    this.queryDebug(`Executing getOpeningAddedEvent(${eventId})`)

    return (
      await this.queryNodeProvider.query<Pick<Query, 'openingAddedEvents'>>({
        query: OPENING_ADDED_BY_ID,
        variables: { eventId },
      })
    ).data.openingAddedEvents[0]
  }

  public async getOpeningFilledEvent(
    blockNumber: number,
    indexInBlock: number
  ): Promise<OpeningFilledEvent | undefined> {
    const OPENING_FILLED_BY_ID = gql`
      query($eventId: ID!) {
        openingFilledEvents(where: { eventId_eq: $eventId }) {
          event {
            inBlock
            inExtrinsic
            indexInBlock
            type
          }
          group {
            name
          }
          opening {
            id
          }
          workersHired {
            id
            group {
              name
            }
            membership {
              id
            }
            roleAccount
            rewardAccount
            stakeAccount
            status {
              __typename
            }
            isLead
            stake
            payouts {
              id
            }
            hiredAtBlock
            hiredAtTime
            application {
              id
            }
            storage
          }
        }
      }
    `

    const eventId = `${blockNumber}-${indexInBlock}`
    this.queryDebug(`Executing getOpeningFilledEvent(${eventId})`)

    return (
      await this.queryNodeProvider.query<Pick<Query, 'openingFilledEvents'>>({
        query: OPENING_FILLED_BY_ID,
        variables: { eventId },
      })
    ).data.openingFilledEvents[0]
  }
}
