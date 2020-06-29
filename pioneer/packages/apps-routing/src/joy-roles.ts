import { Routes } from './types';

import Roles from '@polkadot/joy-roles/index';

export default ([
  {
    Component: Roles,
    display: {
      needsApi: [
        'query.contentWorkingGroup.mint',
        'query.storageWorkingGroup.mint'
      ]
    },
    i18n: {
      defaultValue: 'Working groups'
    },
    icon: 'users',
    name: 'working-groups'
  }
] as Routes);
