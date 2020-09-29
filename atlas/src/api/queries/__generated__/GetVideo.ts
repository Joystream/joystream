/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: GetVideo
// ====================================================

export interface GetVideo_video_category {
  __typename: "Category";
  id: string;
}

export interface GetVideo_video_media_location_HTTPVideoMediaLocation {
  __typename: "HTTPVideoMediaLocation";
  URL: string;
}

export interface GetVideo_video_media_location_JoystreamVideoMediaLocation {
  __typename: "JoystreamVideoMediaLocation";
  dataObjectID: string;
}

export type GetVideo_video_media_location = GetVideo_video_media_location_HTTPVideoMediaLocation | GetVideo_video_media_location_JoystreamVideoMediaLocation;

export interface GetVideo_video_media {
  __typename: "VideoMedia";
  id: string;
  pixelHeight: number;
  pixelWidth: number;
  location: GetVideo_video_media_location;
}

export interface GetVideo_video_channel {
  __typename: "Channel";
  id: string;
  avatarPhotoURL: string | null;
  handle: string;
}

export interface GetVideo_video {
  __typename: "Video";
  id: string;
  title: string;
  description: string;
  category: GetVideo_video_category;
  views: number;
  duration: number;
  thumbnailURL: string;
  publishedOnJoystreamAt: GQLDate;
  media: GetVideo_video_media;
  channel: GetVideo_video_channel;
}

export interface GetVideo {
  video: GetVideo_video | null;
}

export interface GetVideoVariables {
  id: string;
}
