import React from 'react';

import { Controller, View } from '@polkadot/joy-utils/index'

import { ITransport } from '../transport'

import {
  ContentCurators,
  WorkingGroupMembership,
  StorageAndDistributionMembership,
} from './WorkingGroup'

type State = {
  contentCurators?: WorkingGroupMembership,
  storageProviders?: StorageAndDistributionMembership,
}

export class WorkingGroupsController extends Controller<State, ITransport> {
  constructor(transport: ITransport, initialState: State = {}) {
    super(transport, {})
    this.getCurationGroup()
    this.getStorageGroup()
  }

  getCurationGroup() {
    this.transport.curationGroup().then((value: WorkingGroupMembership) => {
      this.setState({ contentCurators: value })
      this.dispatch()
    })
  }

  getStorageGroup() {
    this.transport.storageGroup().then((value: StorageAndDistributionMembership) => {
      this.setState({ storageProviders: value })
      this.dispatch()
    })
  }
}

export const WorkingGroupsView = View<WorkingGroupsController, State>(
  (state) => (
    <ContentCurators {...state.contentCurators!} />
  )
)
