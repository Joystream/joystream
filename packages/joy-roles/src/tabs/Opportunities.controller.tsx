import React from 'react';

import { Observable, View } from '@polkadot/joy-utils/index'

import { ITransport } from '../transport'

import {
  WorkingGroupOpening,
  OpeningsView,
} from './Opportunities'

type State = {
  blockTime?: number,
  opportunities?: Array<WorkingGroupOpening>,
}

// TODO: add error states and URL params (latter to View?)
export class OpportunitiesController extends Observable<State, ITransport> {
  constructor(transport: ITransport, initialState: State = {}) {
    super(transport, initialState)
    this.getOpportunities()
    this.getBlocktime()
  }

  getOpportunities() {
    this.transport.currentOpportunities().then(value => {
      this.state.opportunities = value
      this.dispatch()
    })
  }

  getBlocktime() {
    this.transport.expectedBlockTime().then(value => {
      this.state.blockTime = value
      this.dispatch()
    })
  }

  hideOpportunities() {
    this.state.opportunities = []
    this.dispatch()
  }
}


type Props = {
  // Any props can go here, as normal
}

export const OpportunitiesView = View<OpportunitiesController, Props, State>(
  (props, state) => (
    <div>
      <button onClick={() => props.controller.hideOpportunities()}>Clear</button>
      <button onClick={() => props.controller.getOpportunities()}>Refresh</button>
      <OpeningsView openings={state.opportunities as Array<WorkingGroupOpening>}
        block_time_in_seconds={state.blockTime as number}
      />
    </div>
  )
)
