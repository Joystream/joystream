import React from 'react';

import { Controller } from '@polkadot/joy-utils/react/helpers';
import { View } from '@polkadot/joy-utils/react/hocs';

import { ITransport } from '../transport';

import { MemberId } from '@joystream/types/members';

import { WorkingGroupOpening,
  OpeningsView } from './Opportunities';

import { AvailableGroups, WorkingGroups } from '../working_groups';

type State = {
  blockTime?: number;
  opportunities?: Array<WorkingGroupOpening>;
  memberId?: MemberId;
}

export class OpportunitiesController extends Controller<State, ITransport> {
  constructor (transport: ITransport, initialState: State = {}) {
    super(transport, initialState);
    this.state.blockTime = this.transport.expectedBlockTime();
  }

  refreshState () {
    void this.getOpportunities();
  }

  setMemberId (memberId?: MemberId) {
    this.state.memberId = memberId;
    this.dispatch();
  }

  async getOpportunities () {
    this.state.opportunities = await this.transport.currentOpportunities();
    this.dispatch();
  }
}

export const OpportunitiesView = View<OpportunitiesController, State>(
  ({ state, controller, params }) => (
    <OpeningsView
      group={AvailableGroups.includes(params.get('group') as any) ? params.get('group') as WorkingGroups : undefined}
      lead={!!params.get('lead')}
      openings={state.opportunities}
      block_time_in_seconds={state.blockTime}
      member_id={state.memberId}
    />
  )
);
