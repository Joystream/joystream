import React from 'react';

import { Controller, View } from '@polkadot/joy-utils/index';

import { ITransport } from '../transport';

import {
  ContentCurators,
  WorkingGroupMembership,
  StorageProviders
} from './WorkingGroup';

import styled from 'styled-components';

type State = {
  contentCurators?: WorkingGroupMembership;
  storageProviders?: WorkingGroupMembership;
}

export class WorkingGroupsController extends Controller<State, ITransport> {
  constructor (transport: ITransport, initialState: State = {}) {
    super(transport, {});
    this.getCurationGroup();
    this.getStorageGroup();
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
      <ContentCurators {...state.contentCurators}/>
      <StorageProviders {...state.storageProviders}/>
    </WorkingGroupsOverview>
  )
);
