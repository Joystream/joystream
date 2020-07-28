import React, { createContext, useContext, useState } from 'react';
import { ApiContext } from '@polkadot/react-api';
import { ApiProps } from '@polkadot/react-api/types';

import Transport from '../../transport/index';

export const TransportContext = createContext<Transport>((null as unknown) as Transport);

export function TransportProvider ({ children }: { children: React.PropsWithChildren<{}> }) {
  const api: ApiProps = useContext(ApiContext);

  if (!api) {
    throw new Error('Cannot create Transport: A Substrate API is required');
  } else if (!api.isApiReady) {
    throw new Error('Cannot create Transport: The Substrate API is not ready yet.');
  }

  // Preserve transport instance in state to allow more effective caching
  const [transportInstance] = useState<Transport>(() => new Transport(api.api));

  return <TransportContext.Provider value={transportInstance}>{children}</TransportContext.Provider>;
}
