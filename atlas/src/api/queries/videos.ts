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
    thumbnailUrl
    createdAt
    media {
      ...VideoMediaFields
    }
    channel {
      id
      avatarPhotoUrl
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
      where: { categoryId_eq: $categoryId, isCurated_eq: false }
      orderBy: [createdAt_DESC]
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

export const GET_VIDEO_WITH_CHANNEL_VIDEOS = gql`
  query GetVideo($id: ID!) {
    video(id: $id) {
      ...VideoFields
      channel {
        id
        avatarPhotoUrl
        handle
        videos {
          ...VideoFields
        }
      }
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
