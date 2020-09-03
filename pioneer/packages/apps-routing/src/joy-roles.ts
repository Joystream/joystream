import { Route } from './types';

import Roles from '@polkadot/joy-roles/index';

export default function create (t: <T = string> (key: string, text: string, options: { ns: string }) => T): Route {
  return {
    Component: Roles,
    display: {
      needsApi: [
        'query.contentWorkingGroup.mint',
        'query.storageWorkingGroup.mint'
      ]
    },
    text: t<string>('nav.roles', 'Working groups', { ns: 'apps-routing' }),
    icon: 'users',
    name: 'working-groups'
  };
}
