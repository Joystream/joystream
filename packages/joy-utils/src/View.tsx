import React, { useState, useEffect } from 'react';

import { Observable } from './Observable'

type controllerProps<C, P, S> = P & {
  controller: C
}

type controllerFn<C, P, S> = (props: controllerProps<C, P, S>, state: S) => void

export function View<C extends Observable<S, any>, P, S>(fn: controllerFn<C, P, S>): React.FC<controllerProps<C, P, S>> {
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

