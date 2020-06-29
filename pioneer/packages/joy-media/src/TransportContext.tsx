import React, { useEffect, useState, useContext, createContext } from 'react';
import { MediaTransport } from './transport';
import { MockTransport } from './transport.mock';
import { SubstrateTransport } from './transport.substrate';
import ApiContext from '@polkadot/react-api/ApiContext';
import { ApiProps } from '@polkadot/react-api/types';

export const TransportContext = createContext<MediaTransport>(undefined as unknown as MediaTransport);

export const useTransportContext = () =>
  useContext(TransportContext);

export const MockTransportProvider = (props: React.PropsWithChildren<{}>) =>
  <TransportContext.Provider value={new MockTransport()}>
    {props.children}
  </TransportContext.Provider>;

export const SubstrateTransportProvider = (props: React.PropsWithChildren<{}>) => {
  const api: ApiProps = useContext(ApiContext);
  const [transport, setTransport] = useState<SubstrateTransport>();
  const [loaded, setLoaded] = useState<boolean>();

  useEffect(() => {
    if (!loaded && api && api.isApiReady) {
      setTransport(new SubstrateTransport(api));
      setLoaded(true);
    }
  }, [loaded]);

  if (!transport) {
    // Substrate API is not ready yet.
    return null;
  }

  return (
    <TransportContext.Provider value={transport}>
      {props.children}
    </TransportContext.Provider>
  );
};
