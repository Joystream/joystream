import React from 'react';
import { Message } from 'semantic-ui-react';

import axios, { CancelToken } from 'axios';

import { AccountId } from '@polkadot/types';
import { withCalls, withMulti } from '@polkadot/ui-api/with';

import { queryToProp } from '@polkadot/joy-utils/index';
import { Url } from '@joystream/types/discovery'

// import store from 'store';

import { parse as parseUrl } from 'url';


export type BootstrapNodes = {
  bootstrapNodes?: Url[],
};

export type DiscoveryProvider = {
  resolveAssetEndpoint: (provider: AccountId, contentId?: string, cancelToken?: CancelToken) => Promise<string>
  shutdown: () => void,
  reportUnreachable: (provider: AccountId) => void
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

  let cache: Map<string, string> = new Map();

  // Load cache from localStorage. If switching between networks and same account id
  // is reused, the cached value will not be correct.

  // try {
  //   const savedCache = JSON.parse(store.get('resolvedProviders'))
  //   cache = new Map(savedCache)
  // } catch (err) {
  //   console.log('failed to load resolve cache from store')
  // }

  const resolveAssetEndpoint = async (storageProvider: AccountId, contentId?: string, cancelToken?: CancelToken) => {
    const cacheKey = storageProvider.toString();
    let assetApiEndpoint;

    if(cache.has(cacheKey)) {
      // TODO: check validity
      // if close to expiery, still return cached value, but query and updae cache in background
      assetApiEndpoint = cache.get(cacheKey)
    } else {
      for(let n = 0; bootstrapNodes && n < bootstrapNodes.length; n++) {
        let discoveryUrl = normalizeUrl(bootstrapNodes[n])

        try {
          parseUrl(discoveryUrl);
        } catch(err) {
          continue;
        }

        const serviceInfoQuery = `${discoveryUrl}/discover/v0/${storageProvider.toString()}`;

        try {
          console.log(`resolving ${cacheKey} using ${discoveryUrl}`);

          const serviceInfo = await axios.get(serviceInfoQuery, {cancelToken}) as any

          if (!serviceInfo) {
            continue;
          }

          assetApiEndpoint = normalizeUrl(JSON.parse(serviceInfo.data.serialized).asset.endpoint);
          cache.set(cacheKey, assetApiEndpoint);
          break;
        } catch (err) {
          console.log(err);
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

  const shutdown = () => {
    // store.set('resolvedProviders', JSON.stringify(Array.from(cache.entries())));
  }

  const reportUnreachable = (provider: AccountId) => {
    // clear the cache entry
    cache.delete(provider.toString());
  }

  return { resolveAssetEndpoint, shutdown, reportUnreachable };
}

type State = {
  discoveryProvider?: DiscoveryProvider
}

function setDiscoveryProvider<P extends DiscoveryProviderProps> (Component: React.ComponentType<P>) {
  console.log('setDiscoveryProvider called!');

  return class extends React.Component<P & BootstrapNodes, State> {
    state: State = {}

    componentWillReceiveProps() {
      let { discoveryProvider } = this.state;

      // only set the discovery provider once
      if (discoveryProvider) {
        return
      } else {
        const { bootstrapNodes } = this.props;
        const discoveryProvider = newDiscoveryProvider({bootstrapNodes});
        if (discoveryProvider) {
          this.setState({discoveryProvider})
        }
      }
    }

    componentWillUnmount() {
      let { discoveryProvider } = this.state;
      if (discoveryProvider) {
        discoveryProvider.shutdown();
      }
    }

    render () {
      const { discoveryProvider } = this.state;

      if (!discoveryProvider) {
        // Still loading bootstrap nodes...
        return (
          <Message info className='JoyMainStatus'>
              <Message.Header>Initializing..</Message.Header>
              <div style={{ marginTop: '1rem' }}>
                Bootstrapping discovery service.
              </div>
          </Message>
        );
      } else {
        return (
          <Component
            {...this.props}
            discoveryProvider={discoveryProvider}
          />
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
