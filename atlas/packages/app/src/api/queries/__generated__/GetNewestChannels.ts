/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: GetNewestChannels
// ====================================================

export interface GetNewestChannels_channels {
  __typename: "Channel";
  id: string;
  handle: string;
  avatarPhotoURL: string;
  totalViews: number;
}

export interface GetNewestChannels {
  channels: GetNewestChannels_channels[];
}
