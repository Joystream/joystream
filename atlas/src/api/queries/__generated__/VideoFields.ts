/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL fragment: VideoFields
// ====================================================

export interface VideoFields_category {
  __typename: "Category";
  id: string;
}

export interface VideoFields_media_location_HTTPVideoMediaLocation {
  __typename: "HTTPVideoMediaLocation";
  URL: string;
}

export interface VideoFields_media_location_JoystreamVideoMediaLocation {
  __typename: "JoystreamVideoMediaLocation";
  dataObjectID: string;
}

export type VideoFields_media_location = VideoFields_media_location_HTTPVideoMediaLocation | VideoFields_media_location_JoystreamVideoMediaLocation;

export interface VideoFields_media {
  __typename: "VideoMedia";
  id: string;
  pixelHeight: number;
  pixelWidth: number;
  location: VideoFields_media_location;
}

export interface VideoFields_channel {
  __typename: "Channel";
  id: string;
  avatarPhotoUrl: string | null;
  handle: string;
}

export interface VideoFields {
  __typename: "Video";
  id: string;
  title: string;
  description: string;
  category: VideoFields_category;
  views: number | null;
  duration: number;
  thumbnailUrl: string;
  createdAt: GQLDate;
  media: VideoFields_media;
  channel: VideoFields_channel;
}
