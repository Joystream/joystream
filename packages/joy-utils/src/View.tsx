import React, { useState, useEffect, useMemo } from 'react';

import { Observable } from './Observable'

export interface EmptyProps {}

export type Params = Map<string, string>

const newParams = (): Params => {
	return new Map<string,string>()
}

type controllerProps<C, P, S> = P & {
  params?: Params
}

type controllerFn<C, P, S> = (props: controllerProps<C, P, S>, state: S, controller: C, params: Params) => React.ReactElement | null

export type ViewComponent<C, P = any, S = any> = React.FC<controllerProps<C, P, S>>

export type ViewComponentFactory<C, P = any, S = any> = (controller: C) => React.FC<controllerProps<C, P, S>>

export function View<C extends Observable<S, any>, P, S>(fn: controllerFn<C, P, S>): ViewComponentFactory<C, P, S> {
  return (controller: C) => {
    return (props: controllerProps<C, P, S>, ctx: any): React.ReactElement | null => {
      const [state, setState] = useState<S>(controller.state)

      const onUpdate = (newState: S) => {
        setState({ ...newState })
      }

      useEffect(() => {
        controller.subscribe(onUpdate)

        return () => {
          controller.unsubscribe(onUpdate)
        }
      })

      let context: Params
      if (typeof props.params !== 'undefined') {
        context = props.params
      } else {
        context = newParams()
      }

      return useMemo(() => fn(props, state, controller, context), [state])
    }
  }
}
