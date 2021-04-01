import { gql, ApolloClient, ApolloQueryResult, NormalizedCacheObject } from '@apollo/client'
import { MemberId } from '@joystream/types/common'
import { Query } from './QueryNodeApiSchema.generated'
import Debugger from 'debug'

export class QueryNodeApi {
  private readonly queryNodeProvider: ApolloClient<NormalizedCacheObject>
  private readonly queryDebug: Debugger.Debugger

  constructor(queryNodeProvider: ApolloClient<NormalizedCacheObject>) {
    this.queryNodeProvider = queryNodeProvider
    this.queryDebug = Debugger('query-node-api:query')
  }

  public tryQueryWithTimeout<QueryResultT extends ApolloQueryResult<unknown>>(
    query: () => Promise<QueryResultT>,
    assertResultIsValid: (res: QueryResultT) => void,
    timeoutMs = 120000,
    retryTimeMs = 30000
  ): Promise<QueryResultT> {
    const retryDebug = Debugger('query-node-api:retry')
    return new Promise((resolve, reject) => {
      let lastError: any
      const timeout = setTimeout(() => {
        console.error(`Query node query is still failing after timeout was reached (${timeoutMs}ms)!`)
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
            avatarUri
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
            avatarUri
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
            avatarUri
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
            avatarUri
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
}
