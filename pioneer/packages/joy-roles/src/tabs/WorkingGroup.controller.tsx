import React from 'react';

import { Controller, View } from '@polkadot/joy-utils/index'

import { ITransport } from '../transport'

import {
  ContentCurators,
  WorkingGroupMembership,
  StorageAndDistributionMembership,
  GroupLeadStatus,
  ContentLead,
} from './WorkingGroup'

type State = {
  contentCurators?: WorkingGroupMembership,
  storageProviders?: StorageAndDistributionMembership,
  groupLeadStatus?: GroupLeadStatus
}

export class WorkingGroupsController extends Controller<State, ITransport> {
  constructor(transport: ITransport, initialState: State = {}) {
    super(transport, {})
    this.getCurationGroup()
    this.getStorageGroup()
    this.getGroupLeadStatus()
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

  getGroupLeadStatus() {
    this.transport.groupLeadStatus().then((value: GroupLeadStatus) => {
      this.setState({ groupLeadStatus: value })
      this.dispatch()
    })
  }
}

export const WorkingGroupsView = View<WorkingGroupsController, State>(
  (state) => (
    <div>
    <ContentCurators {...state.contentCurators!} />
    <ContentLead {...state.groupLeadStatus!} />
    </div>
  )
)
