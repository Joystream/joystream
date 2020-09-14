/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: GetChannel
// ====================================================

export interface GetChannel_channel {
  __typename: "Channel";
  id: string;
  handle: string;
  avatarPhotoURL: string;
  coverPhotoURL: string;
  totalViews: number;
}

export interface GetChannel {
  channel: GetChannel_channel | null;
}

export interface GetChannelVariables {
  id: string;
}
