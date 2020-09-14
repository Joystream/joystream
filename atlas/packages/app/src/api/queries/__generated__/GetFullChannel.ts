/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: GetFullChannel
// ====================================================

export interface GetFullChannel_channel_videos_media_location_HTTPVideoMediaLocation {
  __typename: "HTTPVideoMediaLocation";
  host: string;
  port: number | null;
}

export interface GetFullChannel_channel_videos_media_location_JoystreamVideoMediaLocation {
  __typename: "JoystreamVideoMediaLocation";
  dataObjectID: string;
}

export type GetFullChannel_channel_videos_media_location = GetFullChannel_channel_videos_media_location_HTTPVideoMediaLocation | GetFullChannel_channel_videos_media_location_JoystreamVideoMediaLocation;

export interface GetFullChannel_channel_videos_media {
  __typename: "VideoMedia";
  pixelHeight: number;
  pixelWidth: number;
  location: GetFullChannel_channel_videos_media_location;
}

export interface GetFullChannel_channel_videos_channel {
  __typename: "Channel";
  id: string;
  avatarPhotoURL: string;
  handle: string;
}

export interface GetFullChannel_channel_videos {
  __typename: "Video";
  id: string;
  title: string;
  description: string;
  views: number;
  duration: number;
  thumbnailURL: string;
  publishedOnJoystreamAt: GQLDate;
  media: GetFullChannel_channel_videos_media;
  channel: GetFullChannel_channel_videos_channel;
}

export interface GetFullChannel_channel {
  __typename: "Channel";
  id: string;
  handle: string;
  avatarPhotoURL: string;
  coverPhotoURL: string;
  totalViews: number;
  videos: GetFullChannel_channel_videos[] | null;
}

export interface GetFullChannel {
  channel: GetFullChannel_channel | null;
}

export interface GetFullChannelVariables {
  id: string;
}
