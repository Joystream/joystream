import React, { useState, useEffect} from 'react';

// FIXME! Remove
//import { Controller, controllerProps } from '@polkadot/joy-utils/index'

import { ITransport } from '../transport'

import { 
  WorkingGroupOpening, 
  OpeningsView,
} from './Opportunities'

type State = {
	a: number
  blockTime?: number,
  opportunities?: Array<WorkingGroupOpening>,
}

// FIXME! Move to proper place
type Observer<S> = (v: S) => void

export class Observable<S, T> {
  public state: S
  protected transport: T
  protected observers: Observer<S>[] = []

  constructor(transport: T, initialState:S) {
    this.state = initialState
    this.transport = transport
  }

  public attach(observer: Observer<S>) {
	  this.observers.push(observer)
  }

  public detach(observerToRemove: Observer<S>) {
	  this. observers = this.observers.filter(observer => observerToRemove !== observer)
  }

  public dispatch() {
	  this.observers.forEach(observer => observer(this.state))
  }
}

// TODO: add error states and URL params (latter to View?)
export class OpportunitiesController extends Observable<State, ITransport> {
  constructor(transport: ITransport, initialState:State={a:1}) {
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

export type controllerProps<Str, P, S> =  P & {
  store: Str
}

// FIXME! Move to proper place
export function View<T, Str extends Observable<S, T>, P, S>(fn: (props: controllerProps<Str, P,S>, state: S) => any): React.FC<controllerProps<Str, P, S>> {
  return (props: controllerProps<Str, P,S>) => {

    const [state, setState] = useState<S>(props.store.state)

    const onUpdate = (newState: S) => {
      setState({...newState})
    }

    useEffect( ()=> {
      props.store.attach(onUpdate)

      return () => {
        props.store.detach(onUpdate)
      }
    })

    return fn(props, state)
  }
}

type Props = {
}

export const OpportunitiesView = View<ITransport, OpportunitiesController, Props, State>(
  (props, state) => {
    return (
      <div>
        <button onClick={() =>props.store.hideOpportunities()}>Clear</button>
          <button onClick={() =>props.store.getOpportunities()}>Refresh</button>
            <OpeningsView openings={state.opportunities as Array<WorkingGroupOpening>}  
              block_time_in_seconds={state.blockTime as number} 
            /> 
          </div>
    )
  })
