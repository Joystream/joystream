import React, { useEffect } from 'react';

import { Controller } from '@polkadot/joy-utils/react/helpers';
import { View, RenderComponentProps } from '@polkadot/joy-utils/react/hocs/View';

import { ITransport } from '../transport';

import { MemberId } from '@joystream/types/members';

import { WorkingGroupOpening,
  OpeningError,
  OpeningView } from './Opportunities';

import { WorkingGroups, AvailableGroups } from '../working_groups';

type State = {
  blockTime?: number;
  opportunity?: WorkingGroupOpening;
  memberId?: MemberId;
}

export class OpportunityController extends Controller<State, ITransport> {
  constructor (transport: ITransport, initialState: State = {}) {
    super(transport, initialState);
    this.state.blockTime = this.transport.expectedBlockTime();
  }

  setMemberId (memberId?: MemberId) {
    this.state.memberId = memberId;
    this.dispatch();
  }

  async getOpportunity (group: string | undefined, id: string | undefined) {
    if (!id || !group) {
      return;
    }

    if (!AvailableGroups.includes(group as any)) {
      return this.onError('OppportunityController: invalid group provided in params');
    }

    this.state.opportunity = await this.transport.groupOpening(group as WorkingGroups, parseInt(id));
    this.dispatch();
  }
}

function OpportunityRenderer ({ state, controller, params }: RenderComponentProps<OpportunityController, State>) {
  useEffect(() => {
    void controller.getOpportunity(params.get('group'), params.get('id'));
  }, [params]);

  return (
    <OpeningView {...state.opportunity!} block_time_in_seconds={state.blockTime!} member_id={state.memberId} />
  );
}

export const OpportunityView = View<OpportunityController, State>({
  errorComponent: OpeningError,
  renderComponent: OpportunityRenderer
});
