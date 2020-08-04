import React from 'react';

import { Controller, memoize, View, Params } from '@polkadot/joy-utils/index';

import { ITransport } from '../transport';

import { MemberId } from '@joystream/types/members';

import {
  WorkingGroupOpening,
  OpeningError,
  OpeningView
} from './Opportunities';

import { WorkingGroups, AvailableGroups } from '../working_groups';

type State = {
  blockTime?: number;
  opportunity?: WorkingGroupOpening;
  memberId?: MemberId;
}

export class OpportunityController extends Controller<State, ITransport> {
  constructor (transport: ITransport, memberId?: MemberId, initialState: State = {}) {
    super(transport, initialState);
    this.state.memberId = memberId;
    this.getBlocktime();
  }

  @memoize()
  async getOpportunity (group: string | undefined, id: string | undefined) {
    if (!id) {
      return this.onError('OpportunityController: no ID provided in params');
    }

    if (!group || !AvailableGroups.includes(group as any)) {
      return this.onError('OppportunityController: invalid group provided in params');
    }

    this.state.opportunity = await this.transport.groupOpening(group as WorkingGroups, parseInt(id));
    this.dispatch();
  }

  async getBlocktime () {
    this.state.blockTime = await this.transport.expectedBlockTime();
    this.dispatch();
  }
}

const renderOpeningView = (state: State, controller: OpportunityController, params: Params) => {
  controller.getOpportunity(params.get('group'), params.get('id'));
  return (
    <OpeningView {...state.opportunity!} block_time_in_seconds={state.blockTime!} member_id={state.memberId} />
  );
};

export const OpportunityView = View<OpportunityController, State>({
  errorComponent: OpeningError,
  render: renderOpeningView
});
