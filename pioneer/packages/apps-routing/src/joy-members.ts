import { Route } from './types';

import Members from '@polkadot/joy-members/index';

export default function create (t: <T = string> (key: string, text: string, options: { ns: string }) => T): Route {
  return {
    Component: Members,
    display: {
      needsApi: ['query.members.nextMemberId']
    },
    icon: 'users',
    name: 'members',
    text: t<string>('nav.membership', 'Membership', { ns: 'apps-routing' })
  };
}
