/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: GetNewestVideos
// ====================================================

export interface GetNewestVideos_videosConnection_edges_node_category {
  __typename: "Category";
  id: string;
}

export interface GetNewestVideos_videosConnection_edges_node_media_location_HTTPVideoMediaLocation {
  __typename: "HTTPVideoMediaLocation";
  URL: string;
}

export interface GetNewestVideos_videosConnection_edges_node_media_location_JoystreamVideoMediaLocation {
  __typename: "JoystreamVideoMediaLocation";
  dataObjectID: string;
}

export type GetNewestVideos_videosConnection_edges_node_media_location = GetNewestVideos_videosConnection_edges_node_media_location_HTTPVideoMediaLocation | GetNewestVideos_videosConnection_edges_node_media_location_JoystreamVideoMediaLocation;

export interface GetNewestVideos_videosConnection_edges_node_media {
  __typename: "VideoMedia";
  id: string;
  pixelHeight: number;
  pixelWidth: number;
  location: GetNewestVideos_videosConnection_edges_node_media_location;
}

export interface GetNewestVideos_videosConnection_edges_node_channel {
  __typename: "Channel";
  id: string;
  avatarPhotoUrl: string | null;
  handle: string;
}

export interface GetNewestVideos_videosConnection_edges_node {
  __typename: "Video";
  id: string;
  title: string;
  description: string;
  category: GetNewestVideos_videosConnection_edges_node_category;
  views: number | null;
  duration: number;
  thumbnailUrl: string;
  createdAt: GQLDate;
  media: GetNewestVideos_videosConnection_edges_node_media;
  channel: GetNewestVideos_videosConnection_edges_node_channel;
}

export interface GetNewestVideos_videosConnection_edges {
  __typename: "VideoEdge";
  cursor: string;
  node: GetNewestVideos_videosConnection_edges_node;
}

export interface GetNewestVideos_videosConnection_pageInfo {
  __typename: "PageInfo";
  hasNextPage: boolean;
  endCursor: string | null;
}

export interface GetNewestVideos_videosConnection {
  __typename: "VideoConnection";
  edges: GetNewestVideos_videosConnection_edges[];
  pageInfo: GetNewestVideos_videosConnection_pageInfo;
  totalCount: number;
}

export interface GetNewestVideos {
  videosConnection: GetNewestVideos_videosConnection;
}

export interface GetNewestVideosVariables {
  first?: number | null;
  after?: string | null;
  categoryId?: string | null;
}
