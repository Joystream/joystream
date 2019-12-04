import React from 'react';

// Middleware: FIXME: move somewhere outside of hiring package
import { Controller, controllerProps } from '../middleware/controller'

import { ITransport } from '../transport'

import { Role } from '@joystream/types/roles';

type State = {
  a?: Array<Role>,
}

export class OpportunitiesController extends Controller<ITransport, State> {
  constructor (props: controllerProps<ITransport>) {
    super(props, {});

    props.transport.roles().then((value) => { this.setState({a: value}) })
  }

  render() {
    return (
      <pre>{this.state.a && JSON.stringify(this.state.a.toString())}</pre>
    )
  }
}


