import React from 'react';

import { Controller } from '@polkadot/joy-utils/react/helpers';
import { View } from '@polkadot/joy-utils/react/hocs';

import { ITransport } from '../transport';

import { ContentCurators,
  WorkingGroupMembership,
  StorageProviders } from './WorkingGroup';

import styled from 'styled-components';
import { normalizeError } from '@polkadot/joy-utils/functions/misc';

type State = {
  contentCurators?: WorkingGroupMembership;
  storageProviders?: WorkingGroupMembership;
}

export class WorkingGroupsController extends Controller<State, ITransport> {
  constructor (transport: ITransport, initialState: State = {}) {
    super(transport, {});
  }

  refreshState () {
    this.getCurationGroup();
    this.getStorageGroup();
  }

  getCurationGroup () {
    this.transport.curationGroup()
      .then((value: WorkingGroupMembership) => {
        this.setState({ contentCurators: value });
        this.dispatch();
      })
      .catch((e) => this.onError(normalizeError(e)));
  }

  getStorageGroup () {
    this.transport.storageGroup()
      .then((value: WorkingGroupMembership) => {
        this.setState({ storageProviders: value });
        this.dispatch();
      })
      .catch((e) => this.onError(normalizeError(e)));
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
  ({ state }) => (
    <WorkingGroupsOverview>
      <ContentCurators {...state.contentCurators}/>
      <StorageProviders {...state.storageProviders}/>
    </WorkingGroupsOverview>
  )
);
