import React from 'react';

import { Controller, memoize, View } from '@polkadot/joy-utils/index'

import { ITransport } from '../transport'

import {
  WorkingGroupOpening,
  OpeningError,
  OpeningView,
} from './Opportunities'

type State = {
  blockTime?: number,
  opportunity?: WorkingGroupOpening,
}

export class OpportunityController extends Controller<State, ITransport> {
  constructor(transport: ITransport, initialState: State = {}) {
    super(transport, initialState)
    this.getBlocktime()
  }

  @memoize()
  async getOpportunity(id: string | undefined) {
    console.log("opn")
    if (!id) {
      return this.onError("OpportunityController: no ID provided in params")
    }

    this.state.opportunity = await this.transport.curationGroupOpening(parseInt(id))
    console.log("opn")
    this.dispatch()
  }

  async getBlocktime() {
    this.state.blockTime = await this.transport.expectedBlockTime()
    console.log("gbt")
    this.dispatch()
  }
}

export const OpportunityView = View<OpportunityController, State>({
  errorComponent: OpeningError,
  render: (state, controller, params) => {
    controller.getOpportunity(params.get("id"))
    return (
      <OpeningView {...state.opportunity!} block_time_in_seconds={state.blockTime!} />
    )
  }
})
