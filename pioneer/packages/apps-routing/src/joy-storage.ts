import { Routes } from './types';

import Storage from '@polkadot/joy-storage/index';

export default [
  {
    Component: Storage,
    display: {
      needsApi: ['query.actors.actorAccountIds']
    },
    i18n: {
      defaultValue: 'Storage'
    },
    icon: 'database',
    name: 'storage'
  }
] as Routes;
