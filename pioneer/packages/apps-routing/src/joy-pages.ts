import { Route } from './types';

import { ToS, Privacy } from '@polkadot/joy-pages/index';

export function terms (t: <T = string> (key: string, text: string, options: { ns: string }) => T): Route {
  return {
    Component: ToS,
    display: {
      isHidden: true
    },
    text: t<string>('nav.terms', 'Terms of Service', { ns: 'apps-routing' }),
    icon: 'file',
    name: 'pages/tos'
  };
}

export function privacyPolicy (t: <T = string> (key: string, text: string, options: { ns: string }) => T): Route {
  return {
    Component: Privacy,
    display: {
      isHidden: true
    },
    text: t<string>('nav.privacy', 'Privacy Policy', { ns: 'apps-routing' }),
    icon: 'file',
    name: 'pages/privacy'
  };
}
