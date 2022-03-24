import { Route } from './types';

import Media from '@polkadot/joy-media';

export default function create (t: <T = string> (key: string, text: string, options: { ns: string }) => T): Route {
  return {
    Component: Media,
    display: {},
    text: t<string>('nav.media', 'New Pioneer', { ns: 'apps-routing' }),
    icon: 'play-circle',
    name: 'new-pioneer'
  };
}
