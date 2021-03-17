import { gql, ApolloClient, ApolloQueryResult, NormalizedCacheObject } from '@apollo/client'

export class QueryNodeApi {
  private readonly queryNodeProvider: ApolloClient<NormalizedCacheObject>

  constructor(queryNodeProvider: ApolloClient<NormalizedCacheObject>) {
    this.queryNodeProvider = queryNodeProvider
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
}
