import { Route } from './types';

import Forum from '@polkadot/joy-forum/index';

export default function create (t: <T = string> (key: string, text: string, options: { ns: string }) => T): Route {
  return {
    Component: Forum,
    display: {
      needsApi: ['query.forum.threadById']
    },
    text: t<string>('nav.forum', 'Forum', { ns: 'apps-routing' }),
    icon: 'comment-dots',
    name: 'forum'
  };
}
