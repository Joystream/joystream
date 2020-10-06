import gql from 'graphql-tag'

const videoMediaFieldsFragment = gql`
  fragment VideoMediaFields on VideoMedia {
    id
    pixelHeight
    pixelWidth
    location {
      ... on HTTPVideoMediaLocation {
        URL
      }
      ... on JoystreamVideoMediaLocation {
        dataObjectID
      }
    }
  }
`

export const videoFieldsFragment = gql`
  fragment VideoFields on Video {
    id
    title
    description
    category {
      id
    }
    views
    duration
    thumbnailURL
    publishedOnJoystreamAt
    media {
      ...VideoMediaFields
    }
    channel {
      id
      avatarPhotoURL
      handle
    }
  }
  ${videoMediaFieldsFragment}
`

export const GET_VIDEOS = gql`
  query GetVideos($offset: Int, $limit: Int, $categoryId: ID) {
    videos(offset: $offset, limit: $limit, where: { categoryId_eq: $categoryId }) {
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

export const GET_VIDEO = gql`
  query GetVideo($id: ID!) {
    video(id: $id) {
      ...VideoFields
    }
  }
  ${videoFieldsFragment}
`
