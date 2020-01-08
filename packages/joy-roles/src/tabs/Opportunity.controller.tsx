import React from 'react';

import { Observable, Params, View } from '@polkadot/joy-utils/index'

import { ITransport } from '../transport'

import {
  WorkingGroupOpening,
  OpeningView,
} from './Opportunities'

type State = {
  blockTime?: number,
  opportunity?: WorkingGroupOpening,

  // Error capture and display
  hasError: boolean
}

const newEmptyState = (): State => {
  return {
    hasError: false,
  }
}

export class OpportunityController extends Observable<State, ITransport> {
  protected currentOpeningId: string = ""

  constructor(transport: ITransport, initialState: State = newEmptyState()) {
    super(transport, initialState)
    this.getBlocktime()
  }

  protected onError(desc: any) {
    this.state.hasError = true
    console.error(desc)
    this.dispatch()
  }

  getOpportunity(params: Params) {
    const id = params.get("id")
    if (typeof id === "undefined") {
      return this.onError("ApplyController: no ID provided in params")
    }

    if (this.currentOpeningId == id) {
      return
    }

    this.transport.opening(id).then(value => {
      this.state.opportunity = value
      this.dispatch()
    })

    this.currentOpeningId = id
  }

  getBlocktime() {
    this.transport.expectedBlockTime().then(value => {
      this.state.blockTime = value
      this.dispatch()
    })
  }
}

export const OpportunityView = View<OpportunityController, {}, State>(
  (props, state, controller, params) => {
    controller.getOpportunity(params)
    return (
      <OpeningView {...state.opportunity!} block_time_in_seconds={state.blockTime!} />
    )
  }
)
