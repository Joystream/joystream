/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL fragment: VideoMediaFields
// ====================================================

export interface VideoMediaFields_location_HTTPVideoMediaLocation {
  __typename: "HTTPVideoMediaLocation";
  URL: string;
}

export interface VideoMediaFields_location_JoystreamVideoMediaLocation {
  __typename: "JoystreamVideoMediaLocation";
  dataObjectID: string;
}

export type VideoMediaFields_location = VideoMediaFields_location_HTTPVideoMediaLocation | VideoMediaFields_location_JoystreamVideoMediaLocation;

export interface VideoMediaFields {
  __typename: "VideoMedia";
  id: string;
  pixelHeight: number;
  pixelWidth: number;
  location: VideoMediaFields_location;
}
