import gql from 'graphql-tag'
import { videoFieldsFragment } from './videos'

export const channelFieldsFragment = gql`
  fragment ChannelFields on Channel {
    id
    handle
    avatarPhotoUrl
    coverPhotoUrl
  }
`

export const GET_NEWEST_CHANNELS = gql`
  query GetNewestChannels($first: Int, $after: String) {
    channelsConnection(first: $first, after: $after, orderBy: createdAt_DESC) {
      edges {
        cursor
        node {
          ...ChannelFields
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
      totalCount
    }
  }
  ${channelFieldsFragment}
`

export const GET_CHANNEL = gql`
  query GetChannel($id: ID!) {
    channel(id: $id) {
      ...ChannelFields
      videos {
        ...VideoFields
      }
    }
  }
  ${channelFieldsFragment}
  ${videoFieldsFragment}
`
