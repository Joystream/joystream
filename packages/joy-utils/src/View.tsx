import React, { useState, useEffect, useMemo } from 'react';

import { Observable } from './Observable'

type Context = Map<string, string>
const newContext = (): Context => {
	return new Map<string,string>()
}

type controllerProps<C, P, S> = P & {
  context?: Context
}

type controllerFn<C, P, S> = (props: controllerProps<C, P, S>, state: S, controller: C, params?: Map<String, String>) => React.ReactElement | null

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
        controller.attach(onUpdate)

        return () => {
          controller.detach(onUpdate)
        }
      })

      let context:Context
      if (typeof props.context !== 'undefined') {
        context = props.context
      } else {
        context = newContext()
      }

      return useMemo(() => fn(props, state, controller, context), [state])
    }
  }
}
