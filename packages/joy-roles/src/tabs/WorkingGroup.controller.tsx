import React from 'react';
import { Container } from 'semantic-ui-react';

import { Observable, View } from '@polkadot/joy-utils/index'

import { ITransport } from '../transport'

import {
  ContentCurators,
  WorkingGroupProps,
  StorageAndDistribution, StorageAndDistributionProps,
} from './WorkingGroup'

type State = {
  contentCurators?: WorkingGroupProps,
  storageProviders?: StorageAndDistributionProps,
}

export class WorkingGroupsController extends Observable<State, ITransport> {
  constructor(transport: ITransport, initialState: State = {}) {
    super(transport, {})
    this.getCurationGroup()
    this.getStorageGroup()
  }

  getCurationGroup() {
    this.transport.curationGroup().then((value: WorkingGroupProps) => {
      this.setState({ contentCurators: value })
      this.dispatch()
    })
  }

  getStorageGroup() {
    this.transport.storageGroup().then((value: StorageAndDistributionProps) => {
      this.setState({ storageProviders: value })
      this.dispatch()
    })
  }
}

export const WorkingGroupsView = View<WorkingGroupsController, {}, State>(
  (props, state) => (
    <Container>
      <ContentCurators {...state.contentCurators!} />
      <StorageAndDistribution {...state.storageProviders!} />
    </Container>
  )
)
