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

export const GET_NEWEST_VIDEOS = gql`
  query GetNewestVideos($first: Int, $after: String, $categoryId: ID) {
    videosConnection(
      first: $first
      after: $after
      where: { categoryId_eq: $categoryId }
      orderBy: [publishedOnJoystreamAt_DESC]
    ) {
      edges {
        cursor
        node {
          ...VideoFields
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
      totalCount
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

export const ADD_VIDEO_VIEW = gql`
  mutation AddVideoView($id: ID!) {
    addVideoView(videoID: $id) {
      id
      views
    }
  }
`
