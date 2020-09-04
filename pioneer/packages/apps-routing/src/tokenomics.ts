// Copyright 2017-2019 @polkadot/apps-routing authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { Routes } from './types';

import Tokenomics from '@polkadot/joy-tokenomics';

export default ([
  {
    Component: Tokenomics,
    display: {
      needsAccounts: true,
      needsApi: [
        'tx.balances.transfer'
      ]
    },
    i18n: {
      defaultValue: 'Overview'
    },
    icon: 'th',
    name: 'tokenomics'
  }
] as Routes);
