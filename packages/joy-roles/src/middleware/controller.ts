import React from 'react';

export type controllerProps<T> = {
  transport: T
}

export type ControllerComponent<P> = React.ComponentType<controllerProps<P>>

export abstract class Controller<P, S = {}> extends React.PureComponent<controllerProps<P>, S> {
  constructor(props: controllerProps<P>, initialState: S) {
    super(props);
    this.state = initialState
  }
}

