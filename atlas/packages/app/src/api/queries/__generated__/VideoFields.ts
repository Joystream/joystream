/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL fragment: VideoFields
// ====================================================

export interface VideoFields_media_location {
  __typename: 'HTTPVideoMediaLocation'
  host: string
  port: number | null
}

export interface VideoFields_media {
  __typename: 'VideoMedia'
  location: VideoFields_media_location
}

export interface VideoFields_channel {
  __typename: 'Channel'
  id: string
  avatarPhotoURL: string
  handle: string
}

export interface VideoFields {
  __typename: 'Video'
  id: string
  title: string
  description: string
  views: number
  duration: number
  thumbnailURL: string
  publishedOnJoystreamAt: GQLDate
  media: VideoFields_media
  channel: VideoFields_channel
}
