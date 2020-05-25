import { Routes } from './types';

import Proposals from '@polkadot/joy-proposals/';

export default [
  {
    Component: Proposals,
    display: {
      needsApi: ['query.proposalsEngine.proposalCount']
    },
    i18n: {
      defaultValue: 'Proposals'
    },
    icon: 'tasks',
    name: 'proposals'
  }
] as Routes;
