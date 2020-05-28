import React, { createContext, useContext } from 'react';
import { ApiContext } from '@polkadot/react-api';
import { ApiProps } from '@polkadot/react-api/types';

import Transport from '../../transport';

export const TransportContext = createContext<Transport>((null as unknown) as Transport);

export function TransportProvider ({ children }: { children: React.PropsWithChildren<{}> }) {
  const api: ApiProps = useContext(ApiContext);

  if (!api) {
    throw new Error('Cannot create Transport: A Substrate API is required');
  } else if (!api.isApiReady) {
    throw new Error('Cannot create Transport: The Substrate API is not ready yet.');
  }

  const transport = new Transport(api.api);

  return <TransportContext.Provider value={transport}>{children}</TransportContext.Provider>;
}
