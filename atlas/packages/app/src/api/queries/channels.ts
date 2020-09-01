import gql from 'graphql-tag'

const channelFieldsFragment = gql`
  fragment ChannelFields on Channel {
    id
    handle
    avatarPhotoURL
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
