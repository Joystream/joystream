/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: GetChannel
// ====================================================

export interface GetChannel_channel_videos_category {
  __typename: "Category";
  id: string;
}

export interface GetChannel_channel_videos_media_location_HTTPVideoMediaLocation {
  __typename: "HTTPVideoMediaLocation";
  URL: string;
}

export interface GetChannel_channel_videos_media_location_JoystreamVideoMediaLocation {
  __typename: "JoystreamVideoMediaLocation";
  dataObjectID: string;
}

export type GetChannel_channel_videos_media_location = GetChannel_channel_videos_media_location_HTTPVideoMediaLocation | GetChannel_channel_videos_media_location_JoystreamVideoMediaLocation;

export interface GetChannel_channel_videos_media {
  __typename: "VideoMedia";
  id: string;
  pixelHeight: number;
  pixelWidth: number;
  location: GetChannel_channel_videos_media_location;
}

export interface GetChannel_channel_videos_channel {
  __typename: "Channel";
  id: string;
  avatarPhotoURL: string | null;
  handle: string;
}

export interface GetChannel_channel_videos {
  __typename: "Video";
  id: string;
  title: string;
  description: string;
  category: GetChannel_channel_videos_category;
  views: number | null;
  duration: number;
  thumbnailURL: string;
  publishedOnJoystreamAt: GQLDate;
  media: GetChannel_channel_videos_media;
  channel: GetChannel_channel_videos_channel;
}

export interface GetChannel_channel {
  __typename: "Channel";
  id: string;
  handle: string;
  avatarPhotoURL: string | null;
  coverPhotoURL: string | null;
  totalViews: number;
  videos: GetChannel_channel_videos[] | null;
}

export interface GetChannel {
  channel: GetChannel_channel | null;
}

export interface GetChannelVariables {
  id: string;
}
