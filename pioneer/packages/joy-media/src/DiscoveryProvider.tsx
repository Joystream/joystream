import React, { useState, useEffect, useContext, createContext } from 'react';
import { Message } from 'semantic-ui-react';
import axios, { CancelToken } from 'axios';

import { StorageProviderId } from '@joystream/types/working-group';
import { Vec } from '@polkadot/types';
import { Url } from '@joystream/types/discovery';
import ApiContext from '@polkadot/react-api/ApiContext';
import { ApiProps } from '@polkadot/react-api/types';
import { JoyInfo } from '@polkadot/joy-utils/JoyStatus';
import { componentName } from '@polkadot/joy-utils/react/helpers';

export type BootstrapNodes = {
  bootstrapNodes?: Url[];
};

export type DiscoveryProvider = {
  resolveAssetEndpoint: (provider: StorageProviderId, contentId?: string, cancelToken?: CancelToken) => Promise<string>;
  reportUnreachable: (provider: StorageProviderId) => void;
};

export type DiscoveryProviderProps = {
  discoveryProvider: DiscoveryProvider;
};

// return string Url with last `/` removed
function normalizeUrl (url: string | Url): string {
  const st: string = url.toString();
  if (st.endsWith('/')) {
    return st.substring(0, st.length - 1);
  }
  return st.toString();
}

type ProviderStats = {
  assetApiEndpoint: string;
  unreachableReports: number;
  resolvedAt: number;
}

function newDiscoveryProvider ({ bootstrapNodes }: BootstrapNodes): DiscoveryProvider {
  const stats: Map<string, ProviderStats> = new Map();

  const resolveAssetEndpoint = async (storageProvider: StorageProviderId, contentId?: string, cancelToken?: CancelToken) => {
    const providerKey = storageProvider.toString();

    let stat = stats.get(providerKey);

    if (
      (!stat || (stat && (Date.now() > (stat.resolvedAt + (10 * 60 * 1000))))) &&
      bootstrapNodes
    ) {
      for (let n = 0; n < bootstrapNodes.length; n++) {
        const discoveryUrl = normalizeUrl(bootstrapNodes[n]);

        try {
          // eslint-disable-next-line no-new
          new URL(discoveryUrl);
        } catch (err) {
          continue;
        }

        const serviceInfoQuery = `${discoveryUrl}/discover/v0/${storageProvider.toString()}`;

        try {
          console.log(`Resolving ${providerKey} using ${discoveryUrl}`);

          const serviceInfo = await axios.get(serviceInfoQuery, { cancelToken }) as any;

          if (!serviceInfo) {
            continue;
          }

          stats.set(providerKey, {
            assetApiEndpoint: normalizeUrl(JSON.parse(serviceInfo.data.serialized).asset.endpoint),
            unreachableReports: 0,
            resolvedAt: Date.now()
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

    console.log(stat);

    if (stat) {
      return `${stat.assetApiEndpoint}/asset/v0/${contentId || ''}`;
    }

    throw new Error('Resolving failed.');
  };

  const reportUnreachable = (provider: StorageProviderId) => {
    const key = provider.toString();
    const stat = stats.get(key);
    if (stat) {
      stat.unreachableReports = stat.unreachableReports + 1;
    }
  };

  return { resolveAssetEndpoint, reportUnreachable };
}

const DiscoveryProviderContext = createContext<DiscoveryProvider>(undefined as unknown as DiscoveryProvider);

export const DiscoveryProviderProvider = (props: React.PropsWithChildren<{}>) => {
  const api: ApiProps = useContext(ApiContext);
  const [provider, setProvider] = useState<DiscoveryProvider | undefined>();
  const [loaded, setLoaded] = useState<boolean | undefined>();

  useEffect(() => {
    const load = async () => {
      if (loaded || !api) return;

      console.log('Discovery Provider: Loading bootstrap node from Substrate...');
      const bootstrapNodes = await api.api.query.discovery.bootstrapEndpoints() as Vec<Url>;
      setProvider(newDiscoveryProvider({ bootstrapNodes }));
      setLoaded(true);
      console.log('Discovery Provider: Initialized');
    };

    load();
  }, [loaded]);

  if (!api || !api.isApiReady) {
    // Substrate API is not ready yet.
    return null;
  }

  if (!provider) {
    return (
      <Message info className='JoyMainStatus'>
        <Message.Header>Initializing Content Discovery Provider</Message.Header>
        <div style={{ marginTop: '1rem' }}>
          Loading bootstrap nodes... Please wait.
        </div>
      </Message>
    );
  }

  return (
    <DiscoveryProviderContext.Provider value={provider}>
      {props.children}
    </DiscoveryProviderContext.Provider>
  );
};

export const useDiscoveryProvider = () =>
  useContext(DiscoveryProviderContext);

export function withDiscoveryProvider (Component: React.ComponentType<DiscoveryProviderProps>) {
  const ResultComponent: React.FunctionComponent<{}> = (props: React.PropsWithChildren<{}>) => {
    const discoveryProvider = useDiscoveryProvider();
    if (!discoveryProvider) {
      return <JoyInfo title={'Please wait...'}>Loading discovery provider.</JoyInfo>;
    }

    return (
      <Component {...props} discoveryProvider={discoveryProvider}>
        {props.children}
      </Component>
    );
  };
  ResultComponent.displayName = `withDiscoveryProvider(${componentName(Component)})`;
  return ResultComponent;
}
