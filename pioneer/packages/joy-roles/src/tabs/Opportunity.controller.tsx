import React from 'react';

import { Controller, memoize, View } from '@polkadot/joy-utils/index'

import { ITransport } from '../transport'

import { MemberId } from '@joystream/types/lib/members';

import {
  WorkingGroupOpening,
  OpeningError,
  OpeningView,
} from './Opportunities'

type State = {
  blockTime?: number,
  opportunity?: WorkingGroupOpening,
  memberId?: MemberId,
}

export class OpportunityController extends Controller<State, ITransport> {
  constructor(transport: ITransport, memberId?: MemberId, initialState: State = {}) {
    super(transport, initialState)
    this.state.memberId = memberId
    this.getBlocktime()
  }

  @memoize()
  async getOpportunity(id: string | undefined) {
    if (!id) {
      return this.onError("OpportunityController: no ID provided in params")
    }

    this.state.opportunity = await this.transport.curationGroupOpening(parseInt(id))
    this.dispatch()
  }

  async getBlocktime() {
    this.state.blockTime = await this.transport.expectedBlockTime()
    this.dispatch()
  }
}

export const OpportunityView = View<OpportunityController, State>({
  errorComponent: OpeningError,
  render: (state, controller, params) => {
    controller.getOpportunity(params.get("id"))
    return (
      <OpeningView {...state.opportunity!} block_time_in_seconds={state.blockTime!} member_id={state.memberId} />
    )
  }
})
