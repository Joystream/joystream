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
    retryTimeMs = 5000
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
              retryDebug(`Unexpected query result, retyring query in ${retryTimeMs}ms...`)
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

  public async getMemberById(id: MemberId): Promise<ApolloQueryResult<Pick<Query, 'membership'>>> {
    const MEMBER_BY_ID_QUERY = gql`
      query($id: ID!) {
        membership(where: { id: $id }) {
          handle
          name
          avatarUri
          about
          controllerAccount
          rootAccount
          registeredAtBlock {
            block
            executedAt
            network
          }
          registeredAtTime
          entry
          referrerId
          isVerified
        }
      }
    `

    this.queryDebug(`Executing getMemberById(${id.toString()}) query`)

    return this.queryNodeProvider.query({ query: MEMBER_BY_ID_QUERY, variables: { id: id.toNumber() } })
  }
}
