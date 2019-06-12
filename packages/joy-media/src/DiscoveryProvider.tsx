import React from 'react';
import { Message } from 'semantic-ui-react';

import axios, { CancelToken } from 'axios';

import { AccountId } from '@polkadot/types';
import { withCalls, withMulti } from '@polkadot/ui-api/with';

import { queryToProp } from '@polkadot/joy-utils/index';
import { Url } from '@joystream/types/discovery'

export type BootstrapNodes = {
  bootstrapNodes?: Url[],
};

export type DiscoveryProvider = {
  resolveAssetEndpoint: (accountId: AccountId, contentId?: string, cancelToken?: CancelToken) => Promise<string>
};

export type DiscoveryProviderProps = {
  discoveryProvider: DiscoveryProvider
};

// return string Url with last `/` removed
function normalizeUrl(url: string | Url) : string {
  let st = new String(url)
  if (st.endsWith('/')) {
    return st.substring(0, st.length - 1);
  }
  return st.toString()
}

function newDiscoveryProvider ({ bootstrapNodes }: BootstrapNodes): DiscoveryProvider | undefined {

  if (!bootstrapNodes || bootstrapNodes.length == 0) {
    return undefined;
  }

  // TODO: pick random node? retry if first node fails..round robin
  let discoveryUrl = normalizeUrl(bootstrapNodes[0])

  // TODO: better url validation
  if (discoveryUrl === '') {
    return undefined;
  }

  const resolveAssetEndpoint = async (storageProvider: AccountId, contentId?: string, cancelToken?: CancelToken) => {
    const serviceInfoQuery = `${discoveryUrl}/discover/v0/${storageProvider.toString()}`;

    const serviceInfo = await axios.get(serviceInfoQuery, {cancelToken}) as any

    if (!serviceInfo) {
      throw new Error('empty response to service discovery query')
    }

    const assetApi = JSON.parse(serviceInfo.data.serialized).asset

    const assetEndpoint = `${normalizeUrl(assetApi.endpoint)}/asset/v0/${contentId || ''}`;

    return assetEndpoint;
  };

  return { resolveAssetEndpoint };
}

function setDiscoveryProvider<P extends DiscoveryProviderProps> (Component: React.ComponentType<P>) {
  return class extends React.Component<P & BootstrapNodes> {
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
