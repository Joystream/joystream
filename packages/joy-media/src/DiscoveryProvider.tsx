import React from 'react';
import { Message } from 'semantic-ui-react';

import axios, { CancelToken } from 'axios';

import { AccountId } from '@polkadot/types/interfaces';
import { withCalls, withMulti } from '@polkadot/react-api/with';

import { queryToProp } from '@polkadot/joy-utils/index';
import { Url } from '@joystream/types/discovery'

import { parse as parseUrl } from 'url';

export type BootstrapNodes = {
  bootstrapNodes?: Url[],
};

export type DiscoveryProvider = {
  resolveAssetEndpoint: (provider: AccountId, contentId?: string, cancelToken?: CancelToken) => Promise<string>
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

type ProviderStats = {
  assetApiEndpoint: string,
  unreachableReports: number,
  resolvedAt: number,
}

function newDiscoveryProvider ({ bootstrapNodes }: BootstrapNodes): DiscoveryProvider | undefined {

  if (!bootstrapNodes || bootstrapNodes.length == 0) {
    return undefined;
  }

  let stats: Map<string, ProviderStats> = new Map();

  const resolveAssetEndpoint = async (storageProvider: AccountId, contentId?: string, cancelToken?: CancelToken) => {
    const providerKey = storageProvider.toString();

    let stat = stats.get(providerKey);

    if (!stat || (stat && (Date.now() > (stat.resolvedAt + (10 * 60 * 1000))))) {
      for(let n = 0; bootstrapNodes && n < bootstrapNodes.length; n++) {
        let discoveryUrl = normalizeUrl(bootstrapNodes[n])

        try {
          parseUrl(discoveryUrl);
        } catch(err) {
          continue;
        }

        const serviceInfoQuery = `${discoveryUrl}/discover/v0/${storageProvider.toString()}`;

        try {
          console.log(`resolving ${providerKey} using ${discoveryUrl}`);

          const serviceInfo = await axios.get(serviceInfoQuery, {cancelToken}) as any

          if (!serviceInfo) {
            continue;
          }

          stats.set(providerKey, {
            assetApiEndpoint: normalizeUrl(JSON.parse(serviceInfo.data.serialized).asset.endpoint),
            unreachableReports: 0,
            resolvedAt: Date.now(),
          });
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

    stat = stats.get(providerKey);

    console.log(stat)

    if (stat) {
      return `${stat.assetApiEndpoint}/asset/v0/${contentId || ''}`;
    }

    throw new Error("Resolving failed.");
  };

  const reportUnreachable = (provider: AccountId) => {
    const key = provider.toString();
    let stat = stats.get(key);
    if (stat) {
      stat.unreachableReports = stat.unreachableReports + 1;
    }
  }

  return { resolveAssetEndpoint, reportUnreachable };
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
    // setDiscoveryProvider // TODO uncomment
  );
}

export function DELETE_ME_withDiscoveryProvider<P extends DiscoveryProviderProps> (Component: React.ComponentType<P>) {
  return withMulti(
    Component,
    loadBootstrapNodes,
    setDiscoveryProvider
  );
}