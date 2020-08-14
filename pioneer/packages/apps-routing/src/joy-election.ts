import { Route } from './types';

import Election from '@polkadot/joy-election/index';
import SidebarSubtitle from '@polkadot/joy-election/SidebarSubtitle';

export default function create (t: <T = string> (key: string, text: string, options: { ns: string }) => T): Route {
  return {
    Component: Election,
    display: {
      needsApi: ['query.council.activeCouncil', 'query.councilElection.stage']
    },
    text: t<string>('nav.election', 'Council', { ns: 'apps-routing' }),
    icon: 'university',
    name: 'council',
    SubtitleComponent: SidebarSubtitle
  }
}
