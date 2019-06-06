import React from 'react';
import { Message } from 'semantic-ui-react';

import axios from 'axios';

import { AccountId } from '@polkadot/types';
import { withCalls, withMulti } from '@polkadot/ui-api/with';

import { queryToProp } from '@polkadot/joy-utils/index';
import { Url } from '@joystream/types/discovery'

export type BootstrapNodes = {
  bootstrapNodes?: Url[],
};

export type DiscoveryProvider = {
  resolveAssetEndpoint: (accountId: AccountId, contentId: string) => Promise<string>
};

export type DiscoveryProviderProps = {
  discoveryProvider: DiscoveryProvider
};

function newDiscoveryProvider ({ bootstrapNodes }: BootstrapNodes): DiscoveryProvider | undefined {
  if (!bootstrapNodes || bootstrapNodes.length == 0) {
    return undefined;
  }

  const discoveryEndpoint = bootstrapNodes[0]

  let discoveryUrl = discoveryEndpoint.toString();

  // TODO: better url validation
  if (discoveryUrl === '') {
    return undefined;
  }

  if (!discoveryEndpoint.endsWith('/')) {
    discoveryUrl += '/'
  }

  const resolveAssetEndpoint = async (liaison: AccountId, contentId?: string) => {
    const serviceInfoQuery = `${discoveryUrl}discover/v0/${liaison.toString()}`;

    // It feels really wrong to be doing this sort of async call in this component!
    const serviceInfo = await axios.get(serviceInfoQuery) as any

    if (!serviceInfo) {
      throw new Error('empty response to service discovery query')
    }

    // assert serviceInfo.version === 1
    const assetApi = JSON.parse(serviceInfo.data.serialized).asset

    // demo - old storage backend
    // return `${assetApi.endpoint}/asset/v${assetApi.version}/920eefe7-adf5-56f7-bee2-13cb0259d34a/${contentId || ''}`
    return `${assetApi.endpoint}/asset/v${assetApi.version}/${contentId || ''}`

  };

  return { resolveAssetEndpoint };
}

function setDiscoveryProvider<P extends DiscoveryProviderProps> (Component: React.ComponentType<P>) {
  return class extends React.Component<P & BootstrapNodes> {
    componentWillUnmount() {
      // cancel axios requests in discoveryProvider
      // https://stackoverflow.com/questions/38329209/how-to-cancel-abort-ajax-request-in-axios
    }

    render () {
      const { bootstrapNodes } = this.props;
      const discoveryProvider = newDiscoveryProvider(this.props);

      if (!bootstrapNodes) {
        // Still loading bootstrap nodes...
        return (
          <Message info className='JoyMainStatus'>
              <Message.Header>Loading</Message.Header>
              <div style={{ marginTop: '1rem' }}>
                Bootstrapping discovery service...
              </div>
          </Message>
        );
      } else if (discoveryProvider) {
        return (
          <Component
            {...this.props}
            discoveryProvider={discoveryProvider}
          />
        );
      } else {
        return (
          <Message error className='JoyMainStatus'>
            <Message.Header>Discovery Bootstrap Nodes not found</Message.Header>
            <div style={{ marginTop: '1rem' }}>
              This functionality cannot work properly without a discovery provider.
            </div>
          </Message>
        );
      }
    }
  };
}

const loadBootstrapNodes = withCalls<BootstrapNodes>(
  queryToProp('query.discovery.bootstrapEndpoints',
    { propName: 'bootstrapNodes' }),
);

export function withDiscoveryProvider<P extends DiscoveryProviderProps> (Component: React.ComponentType<P>) {
  return withMulti(
    Component,
    loadBootstrapNodes,
    setDiscoveryProvider
  );
}
