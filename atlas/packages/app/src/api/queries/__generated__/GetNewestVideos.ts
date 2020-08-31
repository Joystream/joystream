/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: GetNewestVideos
// ====================================================

export interface GetNewestVideos_videos_media_location_HTTPVideoMediaLocation {
  __typename: 'HTTPVideoMediaLocation'
  host: string
  port: number | null
}

export interface GetNewestVideos_videos_media_location_JoystreamVideoMediaLocation {
  __typename: 'JoystreamVideoMediaLocation'
  dataObjectID: string
}

export type GetNewestVideos_videos_media_location =
  | GetNewestVideos_videos_media_location_HTTPVideoMediaLocation
  | GetNewestVideos_videos_media_location_JoystreamVideoMediaLocation

export interface GetNewestVideos_videos_media {
  __typename: 'VideoMedia'
  pixelHeight: number
  pixelWidth: number
  location: GetNewestVideos_videos_media_location
}

export interface GetNewestVideos_videos_channel {
  __typename: 'Channel'
  id: string
  avatarPhotoURL: string
  handle: string
}

export interface GetNewestVideos_videos {
  __typename: 'Video'
  id: string
  title: string
  description: string
  views: number
  duration: number
  thumbnailURL: string
  publishedOnJoystreamAt: GQLDate
  media: GetNewestVideos_videos_media
  channel: GetNewestVideos_videos_channel
}

export interface GetNewestVideos {
  videos: GetNewestVideos_videos[]
}

export interface GetNewestVideosVariables {
  offset?: number | null
  limit?: number | null
}
