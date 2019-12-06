import React from 'react';
import { Container } from 'semantic-ui-react';

// Middleware: FIXME: move somewhere outside of hiring package
import { Controller, controllerProps } from '@polkadot/joy-utils/index'

import { ITransport } from '../transport'

import { 
  WorkingGroupOpening, 
  OpeningsView,
} from './Opportunities'

type State = {
  blockTime?: number,
  opportunities?: Array<WorkingGroupOpening>,
}

export class OpportunitiesController extends Controller<ITransport, State> {
  constructor (props: controllerProps<ITransport>) {
    super(props, {});

  props.transport.expectedBlockTime().then(value => this.setState({blockTime: value}) )
  props.transport.currentOpportunities().then(value => this.setState({opportunities: value}) )
  }

  render() {
    return (
      <OpeningsView openings={this.state.opportunities as Array<WorkingGroupOpening>}  
                    block_time_in_seconds={this.state.blockTime as number} 
      />
    )
  }
}
