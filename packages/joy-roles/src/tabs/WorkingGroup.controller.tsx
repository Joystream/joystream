import React from 'react';
import { Container } from 'semantic-ui-react';

// Middleware: FIXME: move somewhere outside of hiring package
import { Controller, controllerProps } from '@polkadot/joy-utils/index'

import { ITransport } from '../transport'

import {
  ContentCurators,
  WorkingGroupProps,
  StorageAndDistribution, StorageAndDistributionProps,
} from './WorkingGroup'

type State = {
  contentCurators?: WorkingGroupProps,
  storageProviders?: StorageAndDistributionProps,
}

export class WorkingGroupsController extends Controller<ITransport, State> {
  constructor(props: controllerProps<ITransport>) {
    super(props, {});

    props.transport.curationGroup().then(value => this.setState({ contentCurators: value }))
    props.transport.storageGroup().then(value => this.setState({ storageProviders: value }))
  }

  render() {
    return (
      <Container>
        <ContentCurators {...this.state.contentCurators as WorkingGroupProps} />
        <StorageAndDistribution {...this.state.storageProviders as StorageAndDistributionProps} />
      </Container>
    )
  }
}


