// Copyright 2017-2019 @polkadot/ui-settings authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { Option } from '../types';

// type ChainName = 'alexander' | 'edgeware' | 'edgewareTest' | 'flamingFir' | 'kusama';
type ChainName = 'joystream';

interface ChainData {
  chainDisplay: string;
  logo: 'joystream';
  type: string;
}

// type ProviderName = 'commonwealth' | 'parity' | 'unfrastructure' | 'w3f';
type ProviderName = 'joystream_org';

interface PoviderData {
  providerDisplay: string;
  nodes: Partial<Record<ChainName, string>>;
}

// we use this to give an ordering to the chains available
const ORDER_CHAINS: ChainName[] = ['joystream'];

// we use this to order the providers inside the chains
const ORDER_PROVIDERS: ProviderName[] = ['joystream_org'];

// some suplementary info on a per-chain basis
const CHAIN_INFO: Record<ChainName, ChainData> = {
  joystream: {
    chainDisplay: 'Joystream',
    logo: 'joystream',
    type: 'Rome Reckless Testnet'
  },
};

// the actual providers with all  the nodes they provide
const PROVIDERS: Record<ProviderName, PoviderData> = {
  'joystream_org': {
    providerDisplay: 'Joystream.org',
    nodes: {
      'joystream': 'wss://rome-reckless.joystream.org/reckless/rpc/',
    }
  }
};

export const ENDPOINT_DEFAULT = PROVIDERS.joystream_org.nodes.joystream;

export const ENDPOINTS: Option[] = ORDER_CHAINS.reduce((endpoints: Option[], chainName): Option[] => {
  const { chainDisplay, logo, type } = CHAIN_INFO[chainName];

  return ORDER_PROVIDERS.reduce((endpoints: Option[], providerName): Option[] => {
    const { providerDisplay, nodes } = PROVIDERS[providerName];
    const wssUrl = nodes[chainName];

    if (wssUrl) {
      endpoints.push({
        info: logo,
        text: `${chainDisplay} (${type}, hosted by ${providerDisplay})`,
        value: wssUrl
      });
    }

    return endpoints;
  }, endpoints);
}, []);

// add a local node right at the end
ENDPOINTS.push({
  info: 'local',
  text: 'Local Node (Own, 127.0.0.1:9944)',
  value: 'ws://127.0.0.1:9944/'
});
