/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: channel
// ====================================================

export interface channel_channel {
  __typename: "Channel";
  id: string;
  handle: string;
  avatarPhotoURL: string;
  totalViews: number;
}

export interface channel {
  channel: channel_channel | null;
}

export interface channelVariables {
  id: string;
}
