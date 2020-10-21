/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: GetNewestChannels
// ====================================================

export interface GetNewestChannels_channelsConnection_edges_node {
  __typename: "Channel";
  id: string;
  handle: string;
  avatarPhotoURL: string | null;
  coverPhotoURL: string | null;
}

export interface GetNewestChannels_channelsConnection_edges {
  __typename: "ChannelEdge";
  cursor: string;
  node: GetNewestChannels_channelsConnection_edges_node;
}

export interface GetNewestChannels_channelsConnection_pageInfo {
  __typename: "PageInfo";
  hasNextPage: boolean;
  endCursor: string | null;
}

export interface GetNewestChannels_channelsConnection {
  __typename: "ChannelConnection";
  edges: GetNewestChannels_channelsConnection_edges[];
  pageInfo: GetNewestChannels_channelsConnection_pageInfo;
  totalCount: number;
}

export interface GetNewestChannels {
  channelsConnection: GetNewestChannels_channelsConnection;
}

export interface GetNewestChannelsVariables {
  first?: number | null;
  after?: string | null;
}
