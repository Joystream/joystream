import React, { useState, useEffect, useContext, createContext } from 'react';
import { MediaTransport } from './transport';
import { MockTransport } from './transport.mock';
import { SubstrateTransport } from './transport.substrate';
import ApiContext from '@polkadot/react-api/ApiContext';
import { ApiProps } from '@polkadot/react-api/types';
import { MemberId } from '@joystream/types/members';
import { useMyMembership } from '@polkadot/joy-utils/MyMembershipContext';

export const TransportContext = createContext<MediaTransport>(undefined as unknown as MediaTransport);

export const useTransportContext = () =>
  useContext(TransportContext)

export const MockTransportProvider = (props: React.PropsWithChildren<{}>) =>
  <TransportContext.Provider value={new MockTransport()}>
    {props.children}
  </TransportContext.Provider>

export const SubstrateTransportProvider = (props: React.PropsWithChildren<{}>) => {
  const api: ApiProps = useContext(ApiContext);
  
  if (!api || !api.isApiReady) {
    // Substrate API is not ready yet.
    return null
  }

  return (
    <TransportContext.Provider value={new SubstrateTransport(api)}>
      {props.children}
    </TransportContext.Provider>
  )
}

type ResolverProps<A> = A & {
  transport: MediaTransport
  myAddress?: string
  myMemberId?: MemberId
};

type BaseProps<A, B> = {
  component: React.ComponentType<A & B>
  resolveProps?: (props: ResolverProps<A>) => Promise<B>
  unresolvedView?: React.ReactElement
};

export function MediaView<A = {}, B = {}> (baseProps: BaseProps<A, B>) {
  return function (initialProps: A & B) {
    const { component: Component, resolveProps, unresolvedView = null } = baseProps;

    const transport = useTransportContext();
    const { myAddress, myMemberId } = useMyMembership();
    
    const [ resolvedProps, setResolvedProps ] = useState({} as B);
    const [ propsResolved, setPropsResolved ] = useState(false);

    useEffect(() => {
      console.log('Resolving props of media view');

      async function doResolveProps () {
        if (typeof resolveProps === 'function') {
          setResolvedProps(await resolveProps(
            {...initialProps, transport, myAddress, myMemberId }
          ));
        }
        setPropsResolved(true);
      }

      if (!transport) {
        console.log('ERROR: Transport is not defined');
      } else if (!propsResolved) {
        doResolveProps();
      }
    }, [ false ]);
    
    return propsResolved
      ? <Component {...initialProps} {...resolvedProps} />
      : unresolvedView;
  }
}
