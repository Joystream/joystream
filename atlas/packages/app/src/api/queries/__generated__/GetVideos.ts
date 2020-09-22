/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: GetVideos
// ====================================================

export interface GetVideos_videos_category {
  __typename: "Category";
  id: string;
}

export interface GetVideos_videos_media_location_HTTPVideoMediaLocation {
  __typename: "HTTPVideoMediaLocation";
  URL: string;
}

export interface GetVideos_videos_media_location_JoystreamVideoMediaLocation {
  __typename: "JoystreamVideoMediaLocation";
  dataObjectID: string;
}

export type GetVideos_videos_media_location = GetVideos_videos_media_location_HTTPVideoMediaLocation | GetVideos_videos_media_location_JoystreamVideoMediaLocation;

export interface GetVideos_videos_media {
  __typename: "VideoMedia";
  id: string;
  pixelHeight: number;
  pixelWidth: number;
  location: GetVideos_videos_media_location;
}

export interface GetVideos_videos_channel {
  __typename: "Channel";
  id: string;
  avatarPhotoURL: string | null;
  handle: string;
}

export interface GetVideos_videos {
  __typename: "Video";
  id: string;
  title: string;
  description: string;
  category: GetVideos_videos_category;
  views: number;
  duration: number;
  thumbnailURL: string;
  publishedOnJoystreamAt: GQLDate;
  media: GetVideos_videos_media;
  channel: GetVideos_videos_channel;
}

export interface GetVideos {
  videos: GetVideos_videos[];
}

export interface GetVideosVariables {
  offset?: number | null;
  limit?: number | null;
  categoryId?: string | null;
}
