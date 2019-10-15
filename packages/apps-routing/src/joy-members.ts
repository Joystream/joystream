import { Routes } from './types';

import Members from '@polkadot/joy-members/index';

export default ([
  {
    Component: Members,
    display: {
      needsAccounts: true,
      needsApi: [
        'query.members.firstMemberId'
      ]
    },
    i18n: {
      defaultValue: 'Membership'
    },
    icon: 'users',
    name: 'members'
  }
] as Routes);
