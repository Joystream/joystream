import gql from 'graphql-tag'

const videoFieldsFragment = gql`
  fragment VideoFields on Video {
    id
    title
    description
    views
    duration
    thumbnailURL
    publishedOnJoystreamAt
    media {
      location {
        ... on HTTPVideoMediaLocation {
          host
          port
        }
      }
    }
    channel {
      id
      avatarPhotoURL
      handle
    }
  }
`

// TODO: Add proper query params (order, limit, etc.)
export const GET_NEWEST_VIDEOS = gql`
  query GetNewestVideos {
    videos {
      ...VideoFields
    }
  }
  ${videoFieldsFragment}
`

export const GET_FEATURED_VIDEOS = gql`
  query GetFeaturedVideos {
    featured_videos {
      ...VideoFields
    }
  }
  ${videoFieldsFragment}
`
