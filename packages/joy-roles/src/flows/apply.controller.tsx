import React from 'react';

// Middleware: FIXME: move somewhere outside of hiring package
import { Controller, controllerProps } from '@polkadot/joy-utils/index'

import { ITransport } from '../transport'

type State = {
  blockTime?: number,
}

export class ApplyController extends Controller<ITransport, State> {
  constructor (props: controllerProps<ITransport>) {
    super(props, {});

    props.transport.expectedBlockTime().then(value => {
      this.setState({blockTime: value}) 
    })
  }

  render() {
    return this.renderWithError(() => (
      <div>Hello</div>
    ))
  }
}
