import { gql, ApolloClient, ApolloQueryResult, NormalizedCacheObject } from '@apollo/client'
import { BLOCKTIME } from './consts'
import { extendDebug, Debugger } from './Debugger'
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

  public async tryQueryWithTimeout<QueryResultT>(
    query: () => Promise<QueryResultT>,
    assertResultIsValid: (res: QueryResultT) => void,
    retryTimeMs = BLOCKTIME * 3,
    retries = 6
  ): Promise<QueryResultT> {
    const label = query.toString().replace(/^.*\.([A-za-z0-9]+\(.*\))$/g, '$1')
    const debug = this.tryDebug.extend(label)
    let retryCounter = 0
    const retry = async (error: any) => {
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

  public async getChannelbyHandle(handle: string): Promise<ApolloQueryResult<any>> {
    const GET_CHANNEL_BY_TITLE = gql`
      query($handle: String!) {
        channels(where: { handle_eq: $handle }) {
          handle
          description
          coverPhotoUrl
          avatarPhotoUrl
          isPublic
          isCurated
          videos {
            title
            description
            duration
            thumbnailUrl
            isExplicit
            isPublic
          }
        }
      }
    `

    return await this.queryNodeProvider.query({ query: GET_CHANNEL_BY_TITLE, variables: { handle } })
  }

  public async performFullTextSearchOnChannelTitle(text: string): Promise<ApolloQueryResult<any>> {
    const FULL_TEXT_SEARCH_ON_CHANNEL_TITLE = gql`
      query($text: String!) {
        search(text: $text) {
          item {
            ... on Channel {
              handle
              description
            }
          }
        }
      }
    `

    return await this.queryNodeProvider.query({ query: FULL_TEXT_SEARCH_ON_CHANNEL_TITLE, variables: { text } })
  }

  public async performFullTextSearchOnVideoTitle(text: string): Promise<ApolloQueryResult<any>> {
    const FULL_TEXT_SEARCH_ON_VIDEO_TITLE = gql`
      query($text: String!) {
        search(text: $text) {
          item {
            ... on Video {
              title
            }
          }
        }
      }
    `

    return await this.queryNodeProvider.query({ query: FULL_TEXT_SEARCH_ON_VIDEO_TITLE, variables: { text } })
  }

  public async performWhereQueryByVideoTitle(title: string): Promise<ApolloQueryResult<any>> {
    const WHERE_QUERY_ON_VIDEO_TITLE = gql`
      query($title: String!) {
        videos(where: { title_eq: $title }) {
          media {
            location {
              __typename
              ... on JoystreamMediaLocation {
                dataObjectId
              }
            }
          }
        }
      }
    `
    return await this.queryNodeProvider.query({ query: WHERE_QUERY_ON_VIDEO_TITLE, variables: { title } })
  }

  public async getChannels(): Promise<ApolloQueryResult<any>> {
    const query = gql`
      query {
        channels {
          id
          activeVideosCounter
        }
      }
    `
    return await this.queryNodeProvider.query({ query })
  }

  public async getChannelCategories(): Promise<ApolloQueryResult<any>> {
    const query = gql`
      query {
        channelCategories {
          id
          activeVideosCounter
        }
      }
    `
    return await this.queryNodeProvider.query({ query })
  }

  public async getVideoCategories(): Promise<ApolloQueryResult<any>> {
    const query = gql`
      query {
        videoCategories {
          id
          activeVideosCounter
        }
      }
    `
    return await this.queryNodeProvider.query({ query })
  }
}
