import React from 'react';

import { Controller, View } from '@polkadot/joy-utils/index';

import { ITransport } from '../transport';

import { MemberId } from '@joystream/types/members';

import {
  WorkingGroupOpening,
  OpeningsView
} from './Opportunities';

import { AvailableGroups, WorkingGroups } from '../working_groups';

type State = {
  blockTime?: number;
  opportunities?: Array<WorkingGroupOpening>;
  memberId?: MemberId;
}

export class OpportunitiesController extends Controller<State, ITransport> {
  constructor (transport: ITransport, memberId?: MemberId, initialState: State = {}) {
    super(transport, initialState);
    this.state.memberId = memberId;
    this.getOpportunities();
    this.getBlocktime();
  }

  async getOpportunities () {
    this.state.opportunities = await this.transport.currentOpportunities();
    this.dispatch();
  }

  async getBlocktime () {
    this.state.blockTime = await this.transport.expectedBlockTime();
    this.dispatch();
  }
}

export const OpportunitiesView = View<OpportunitiesController, State>(
  (state, controller, params) => (
    <OpeningsView
      group={AvailableGroups.includes(params.get('group') as any) ? params.get('group') as WorkingGroups : undefined}
      lead={!!params.get('lead')}
      openings={state.opportunities}
      block_time_in_seconds={state.blockTime}
      member_id={state.memberId}
    />
  )
);
