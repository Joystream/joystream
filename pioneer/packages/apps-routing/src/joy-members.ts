import { Routes } from './types';

import Members from '@polkadot/joy-members/index';

export default [
  {
    Component: Members,
    display: {
      needsApi: ['query.members.nextMemberId']
    },
    i18n: {
      defaultValue: 'Membership'
    },
    icon: 'users',
    name: 'members'
  }
] as Routes;
