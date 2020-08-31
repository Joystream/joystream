import { Routes } from './types';

import { ToS, Privacy } from '@polkadot/joy-pages/index';

export default ([
  {
    Component: ToS,
    display: {
      isHidden: true
    },
    i18n: {
      defaultValue: 'Terms of Service'
    },
    icon: 'file outline',
    name: 'pages/tos'
  },
  {
    Component: Privacy,
    display: {
      isHidden: true
    },
    i18n: {
      defaultValue: 'Privacy Policy'
    },
    icon: 'file outline',
    name: 'pages/privacy'
  }
] as Routes);
