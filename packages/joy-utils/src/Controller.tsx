import React from 'react';
import { Message } from 'semantic-ui-react'

export type controllerProps<T> = {
  params: Map<string,string>
  transport: T
}

export type ControllerComponent<P> = React.ComponentType<controllerProps<P>>

export type errorState = {
	controllerError?: any[]
}

type withErrorState<T> = T & errorState

export abstract class Controller<P, S = {}> extends React.PureComponent<controllerProps<P>, withErrorState<S>> {
  constructor(props: controllerProps<P>, initialState: withErrorState<S>) {
    super(props);
    this.state = initialState
  }

  protected renderWithError(fn: () => any) {
	  if (typeof this.state.controllerError !== 'undefined') {
      return (
<Message negative>
    <Message.Header>Uh oh! An error has occured</Message.Header>
  </Message>
      )
	  }
	  return fn()
  }

  protected error(err: any) {
    if (typeof this.state.controllerError === 'undefined') {
      this.setState({controllerError: []}, () => this.error(err))
    } else {
		  console.error("Controller error:", err)
      this.setState({ controllerError: this.state.controllerError.concat(err)})
    }
  }
}

