/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: AddVideoView
// ====================================================

export interface AddVideoView_addVideoView {
  __typename: "VideoViewsInfo";
  id: string;
  views: number;
}

export interface AddVideoView {
  addVideoView: AddVideoView_addVideoView;
}

export interface AddVideoViewVariables {
  id: string;
}
