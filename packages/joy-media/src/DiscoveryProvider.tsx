import React from 'react';
import { Message } from 'semantic-ui-react';

import axios, { CancelToken } from 'axios';

import { AccountId } from '@polkadot/types';
import { withCalls, withMulti } from '@polkadot/ui-api/with';

import { queryToProp } from '@polkadot/joy-utils/index';
import { Url } from '@joystream/types/discovery'
// import { debug } from 'util';
// import { string } from 'prop-types';

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

let cache = new Map();

function newDiscoveryProvider ({ bootstrapNodes }: BootstrapNodes): DiscoveryProvider | undefined {

  if (!bootstrapNodes || bootstrapNodes.length == 0) {
    return undefined;
  }

  const resolveAssetEndpoint = async (storageProvider: AccountId, contentId?: string, cancelToken?: CancelToken) => {
    const cacheKey = storageProvider.toString();
    let assetApiEndpoint;

    if(cache.has(cacheKey)) {
      // TODO: check validity
      // if close to expiery, still return cached value, but query and updae cache in background
      assetApiEndpoint = cache.get(cacheKey)
    } else {
      for(let n = 0; n < bootstrapNodes.length; n++) {
        let discoveryUrl = normalizeUrl(bootstrapNodes[n])

        // TODO: better url validation
        if (discoveryUrl === '') {
          continue;
        }

        const serviceInfoQuery = `${discoveryUrl}/discover/v0/${storageProvider.toString()}`;

        try {
          console.log(`resolving ${cacheKey}`)

          const serviceInfo = await axios.get(serviceInfoQuery, {cancelToken}) as any

          if (!serviceInfo) {
            continue;
          }

          assetApiEndpoint = normalizeUrl(JSON.parse(serviceInfo.data.serialized).asset.endpoint);
          cache.set(cacheKey, assetApiEndpoint);
        } catch (err) {
          if (axios.isCancel(err)) {
            throw err;
          }
          continue;
        }
      }
    }

    if (!assetApiEndpoint) {
      throw new Error("Resolving failed.")
    }

    return `${assetApiEndpoint}/asset/v0/${contentId || ''}`;
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
