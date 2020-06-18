import React from 'react';

import { Controller, View } from '@polkadot/joy-utils/index';

import { ITransport } from '../transport';

import {
  ContentCurators,
  WorkingGroupMembership,
  GroupLeadStatus,
  StorageProviders
} from './WorkingGroup';

import { WorkingGroups } from '../working_groups';
import styled from 'styled-components';

type State = {
  contentCurators?: WorkingGroupMembership;
  storageProviders?: WorkingGroupMembership;
  contentLeadStatus?: GroupLeadStatus;
  storageLeadStatus?: GroupLeadStatus;
}

export class WorkingGroupsController extends Controller<State, ITransport> {
  constructor (transport: ITransport, initialState: State = {}) {
    super(transport, {});
    this.getCurationGroup();
    this.getStorageGroup();
    this.getCuratorLeadStatus();
    this.getStorageLeadStatus();
  }

  getCurationGroup () {
    this.transport.curationGroup().then((value: WorkingGroupMembership) => {
      this.setState({ contentCurators: value });
      this.dispatch();
    });
  }

  getStorageGroup () {
    this.transport.storageGroup().then((value: WorkingGroupMembership) => {
      this.setState({ storageProviders: value });
      this.dispatch();
    });
  }

  getCuratorLeadStatus () {
    this.transport.groupLeadStatus(WorkingGroups.ContentCurators).then((value: GroupLeadStatus) => {
      this.setState({ contentLeadStatus: value });
      this.dispatch();
    });
  }

  getStorageLeadStatus () {
    this.transport.groupLeadStatus(WorkingGroups.StorageProviders).then((value: GroupLeadStatus) => {
      this.setState({ storageLeadStatus: value });
      this.dispatch();
    });
  }
}

const WorkingGroupsOverview = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-gap: 2rem;
  @media screen and (max-width: 1199px) {
    grid-template-columns: 1fr;
  }
`;

export const WorkingGroupsView = View<WorkingGroupsController, State>(
  (state) => (
    <WorkingGroupsOverview>
      <ContentCurators {...state.contentCurators} leadStatus={state.contentLeadStatus}/>
      <StorageProviders {...state.storageProviders} leadStatus={state.storageLeadStatus}/>
    </WorkingGroupsOverview>
  )
);
