import React, { useState, useEffect } from 'react';

// FIXME! Remove
//import { Controller, controllerProps } from '@polkadot/joy-utils/index'

import { ITransport } from '../transport'

import {
  WorkingGroupOpening,
  OpeningsView,
} from './Opportunities'

type State = {
  blockTime?: number,
  opportunities?: Array<WorkingGroupOpening>,
}

// FIXME! Move to proper place
type Observer<S> = (v: S) => void

export class Observable<S, T> {
  public state: S
  protected transport: T
  protected observers: Observer<S>[] = []

  constructor(transport: T, initialState: S) {
    this.state = initialState
    this.transport = transport
  }

  public attach(observer: Observer<S>) {
    this.observers.push(observer)
  }

  public detach(observerToRemove: Observer<S>) {
    this.observers = this.observers.filter(observer => observerToRemove !== observer)
  }

  public dispatch() {
    this.observers.forEach(observer => observer(this.state))
  }
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

export type controllerProps<C, P, S> = P & {
  controller: C
}

// FIXME! Move to proper place
export function View<C extends Observable<S, any>, P, S>(fn: (props: controllerProps<C, P, S>, state: S) => any): React.FC<controllerProps<C, P, S>> {
  return (props: controllerProps<C, P, S>) => {

    const [state, setState] = useState<S>(props.controller.state)

    const onUpdate = (newState: S) => {
      setState({ ...newState })
    }

    useEffect(() => {
      props.controller.attach(onUpdate)

      return () => {
        props.controller.detach(onUpdate)
      }
    })

    return fn(props, state)
  }
}

type Props = {
}

export const OpportunitiesView = View<OpportunitiesController, Props, State>(
  (props, state) => {
    return (
      <div>
        <button onClick={props.controller.hideOpportunities}>Clear</button>
        <button onClick={() => props.controller.getOpportunities()}>Refresh</button>
        <OpeningsView openings={state.opportunities as Array<WorkingGroupOpening>}
          block_time_in_seconds={state.blockTime as number}
        />
      </div>
    )
  })
