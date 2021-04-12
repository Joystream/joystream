import React from 'react';

import { Controller } from '@polkadot/joy-utils/react/helpers';
import { View } from '@polkadot/joy-utils/react/hocs';

import { ITransport } from '../transport';
import { AvailableGroups } from '../working_groups';

import { WorkingGroupMembership,
  ContentCurators,
  StorageProviders,
  OperationsGroup } from './WorkingGroup';

import styled from 'styled-components';

type State = {
  curators?: WorkingGroupMembership;
  storageProviders?: WorkingGroupMembership;
  operationsGroup?: WorkingGroupMembership;
}

export class WorkingGroupsController extends Controller<State, ITransport> {
  constructor (transport: ITransport) {
    super(transport, {});
  }

  refreshState () {
    void this.getGroups();
  }

  async getGroups () {
    const newState: Partial<State> = {};

    await Promise.all(
      AvailableGroups.map(async (group) => {
        newState[group] = await this.transport.groupOverview(group);
      })
    );

    this.setState(newState);
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
      <ContentCurators {...state.curators}/>
      <StorageProviders {...state.storageProviders}/>
      <OperationsGroup {...state.operationsGroup}/>
    </WorkingGroupsOverview>
  )
);
