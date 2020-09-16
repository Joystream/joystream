import { Route } from './types';

import { MemoModal } from '@polkadot/joy-utils/react/components/Memo';

export default function create (t: <T = string> (key: string, text: string, options: { ns: string }) => T): Route {
  return {
    // Assert to get around the uncecessary requirement for RouteProps
    Component: MemoModal as React.ComponentType<any>,
    Modal: MemoModal,
    display: {
      isHidden: false,
      needsApi: [
        'tx.memo.updateMemo'
      ]
    },
    icon: 'sticky-note',
    name: 'memo',
    text: t<string>('nav.memo', 'My memo', { ns: 'apps-routing' })
  };
}
