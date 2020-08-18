import { Route } from './types';

import Proposals from '@polkadot/joy-proposals/index';

export default function create (t: <T = string> (key: string, text: string, options: { ns: string }) => T): Route {
  return {
    Component: Proposals,
    display: {
      needsApi: ['query.proposalsEngine.proposalCount']
    },
    text: t<string>('nav.proposals', 'Proposals', { ns: 'apps-routing' }),
    icon: 'tasks',
    name: 'proposals',
    // TODO: useCounter with active proposals count? (could be a nice addition)
  };
}
