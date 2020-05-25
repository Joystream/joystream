import { Routes } from './types';

import Forum from '@polkadot/joy-forum/index';

export default ([
  {
    Component: Forum,
    display: {},
    i18n: {
      defaultValue: 'Forum'
    },
    icon: 'comment alternate outline',
    name: 'forum'
  }
] as Routes);
