import React from 'react';

import { Controller, Params, View } from '@polkadot/joy-utils/index'

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
  protected currentOpeningId: string = ""

  constructor(transport: ITransport, initialState: State = {}) {
    super(transport, initialState)
    this.getBlocktime()
  }

  async getOpportunity(params: Params) {
    const id = params.get("id")
    if (typeof id === "undefined") {
      return this.onError("ApplyController: no ID provided in params")
    }

    if (this.currentOpeningId == id) {
      return
    }

    this.currentOpeningId = id
    this.state.opportunity = await this.transport.opening(id)
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
    controller.getOpportunity(params)
    return (
      <OpeningView {...state.opportunity!} block_time_in_seconds={state.blockTime!} />
    )
  }
})

