// Copyright 2017-2020 @polkadot/apps authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import queryString from 'query-string';
import store from 'store';
import { createEndpoints } from '@polkadot/apps-config/settings';
import { extractIpfsDetails } from '@polkadot/react-hooks/useIpfs';
import settings from '@polkadot/ui-settings';

// Joystream-specific override in order to include default UIMODE
function getInitSettings () {
  // we split here so that both these forms are allowed
  //  - http://localhost:3000/?rpc=wss://substrate-rpc.parity.io/#/explorer
  //  - http://localhost:3000/#/explorer?rpc=wss://substrate-rpc.parity.io
  const urlOptions = queryString.parse(location.href.split('?')[1]);
  const stored = store.get('settings') as Record<string, unknown> || {};

  // uiMode - set to "light" if not in storage
  const uiMode = stored.uiMode ? stored.uiMode as string : 'light';
  let apiUrl: string;

  // if specified, this takes priority
  if (urlOptions.rpc) {
    if (Array.isArray(urlOptions.rpc)) {
      throw new Error('Invalid WS endpoint specified');
    }

    apiUrl = urlOptions.rpc.split('#')[0]; // https://polkadot.js.org/apps/?rpc=ws://127.0.0.1:9944#/explorer;
  }

  const endpoints = createEndpoints(<T = string>(): T => ('' as unknown as T));
  const { ipnsChain } = extractIpfsDetails();

  // check against ipns domains (could be expanded to others)
  if (ipnsChain) {
    const option = endpoints.find(({ dnslink }) => dnslink === ipnsChain);

    if (option) {
      apiUrl = option.value as string;
    }
  }

  const fallbackUrl = endpoints.find(({ value }) => !!value);

  // via settings, or the default chain
  apiUrl = [stored.apiUrl, process.env.WS_URL].includes(settings.apiUrl)
    ? settings.apiUrl // keep as-is
    : fallbackUrl
      ? fallbackUrl.value as string // grab the fallback
      : 'ws://127.0.0.1:9944'; // nothing found, go local

  return { apiUrl, uiMode };
}

const { apiUrl, uiMode } = getInitSettings();

// set the default as retrieved here
settings.set({ apiUrl, uiMode });

console.log('WS endpoint=', apiUrl);
