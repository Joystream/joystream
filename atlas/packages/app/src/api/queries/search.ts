import gql from 'graphql-tag'
import { videoFieldsFragment } from './videos'
import { channelFieldsFragment } from './channels'

export const SEARCH = gql`
  query Search($query_string: String!) {
    search(query_string: $query_string) {
      item {
        ... on Video {
          ...VideoFields
        }
        ... on Channel {
          ...ChannelFields
        }
      }
      rank
    }
  }
  ${channelFieldsFragment}
  ${videoFieldsFragment}
`
