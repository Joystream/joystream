import gql from 'graphql-tag'
import { videoFieldsFragment } from './videos'

export const channelFieldsFragment = gql`
  fragment ChannelFields on Channel {
    id
    handle
    avatarPhotoURL
    coverPhotoURL
    totalViews
  }
`

// TODO: Add proper query params (order, limit, etc.)
export const GET_NEWEST_CHANNELS = gql`
  query GetNewestChannels {
    channels {
      ...ChannelFields
    }
  }
  ${channelFieldsFragment}
`

export const GET_CHANNEL = gql`
  query GetChannel($id: ID!) {
    channel(id: $id) {
      ...ChannelFields
    }
  }
  ${channelFieldsFragment}
`
export const GET_FULL_CHANNEL = gql`
  query GetFullChannel($id: ID!) {
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
