import { Routes } from './types';

import Election from '@polkadot/joy-election/index';

export const councilSidebarName = 'council';

export default [
  {
    Component: Election,
    display: {
      needsApi: ['query.council.activeCouncil', 'query.councilElection.stage']
    },
    i18n: {
      defaultValue: 'Council'
    },
    icon: 'university',
    name: councilSidebarName
  }
] as Routes;
