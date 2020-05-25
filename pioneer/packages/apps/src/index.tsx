// Copyright 2017-2019 @polkadot/apps authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

// import first, get the load done
import settings from '@polkadot/joy-settings/';

import 'semantic-ui-css/semantic.min.css';
import '@polkadot/react-components/i18n';

import queryString from 'query-string';
import React, { Suspense } from 'react';
import ReactDOM from 'react-dom';
import { HashRouter } from 'react-router-dom';
import store from 'store';
import { ThemeProvider } from 'styled-components';
import { getTypeRegistry } from '@polkadot/types';
import { Api } from '@polkadot/react-api';
import { QueueConsumer } from '@polkadot/react-components/Status/Context';
import Queue from '@polkadot/react-components/Status/Queue';
import { BlockAuthors, Events } from '@polkadot/react-query';
import { MyAccountProvider } from '@polkadot/joy-utils/MyAccountContext';
import { MyMembershipProvider } from '@polkadot/joy-utils/MyMembershipContext';

import Apps from './Apps';

const rootId = 'root';
const rootElement = document.getElementById(rootId);

(window as any).Joystream = {
  setRemoteEndpoint: (apiUrl: string) => {
    settings.set({
      apiUrl
    });

    window.location.reload();
  },
  setAdvancedUI: (flag: boolean) => {
    settings.set({
      uiMode: flag ? 'full' : 'light'
    });

    window.location.reload();
  }
};

// we split here so that both these forms are allowed
//  - http://localhost:3000/?rpc=wss://substrate-rpc.parity.io/#/explorer
//  - http://localhost:3000/#/explorer?rpc=wss://substrate-rpc.parity.io
const urlOptions = queryString.parse(location.href.split('?')[1]);
const _wsEndpoint = urlOptions.rpc || process.env.WS_URL || settings.apiUrl;

if (Array.isArray(_wsEndpoint)) {
  throw new Error('Invalid WS endpoint specified');
}

// on some combo of browsers/os, this https://polkadot.js.org/apps/?rpc=ws://127.0.0.1:9944#/explorer
// turns into ws://127.0.0.1:9944#/explorer (split these)
const wsEndpoint = _wsEndpoint.split('#')[0];

console.log('WS endpoint=', wsEndpoint);

try {
  require('@joystream/types/').registerJoystreamTypes();

  const types = store.get('types') || {};
  const names = Object.keys(types);

  if (names.length) {
    getTypeRegistry().register(types);
    console.log('Type registration:', names.join(', '));
  }
} catch (error) {
  console.error('Type registration failed', error);
}

const theme = {
  theme: settings.uiTheme
};

if (!rootElement) {
  throw new Error(`Unable to find element with id '${rootId}'`);
}

ReactDOM.render(
  <Suspense fallback="...">
    <MyAccountProvider>
      <Queue>
        <QueueConsumer>
          {({ queuePayload, queueSetTxStatus }): React.ReactNode => (
            <Api queuePayload={queuePayload} queueSetTxStatus={queueSetTxStatus} url={wsEndpoint}>
              <MyMembershipProvider>
                <BlockAuthors>
                  <Events>
                    <HashRouter>
                      <ThemeProvider theme={theme}>
                        <Apps />
                      </ThemeProvider>
                    </HashRouter>
                  </Events>
                </BlockAuthors>
              </MyMembershipProvider>
            </Api>
          )}
        </QueueConsumer>
      </Queue>
    </MyAccountProvider>
  </Suspense>,
  rootElement
);
