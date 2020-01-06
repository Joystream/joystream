import React, { useState, useEffect, useContext, createContext } from 'react';
import { ITransport } from './transport';
import { MockTransport } from './transport.mock';
import { SubstrateTransport } from './transport.substrate';

export const TransportContext = createContext<ITransport>(undefined as unknown as ITransport);

export const useTransportContext = () =>
  useContext(TransportContext)

export const MockTransportProvider = (props: React.PropsWithChildren<{}>) =>
  <TransportContext.Provider value={new MockTransport()}>
    {props.children}
  </TransportContext.Provider>

export const SubstrateTransportProvider = (props: React.PropsWithChildren<{}>) =>
  <TransportContext.Provider value={new SubstrateTransport()}>
    {props.children}
  </TransportContext.Provider>

type ResolverProps<A> = A & {
  transport: ITransport
};

type BaseProps<A, B> = {
  component: React.ComponentType<A & B>
  resolveProps?: (props: ResolverProps<A>) => Promise<B>
  unresolvedView?: React.ReactElement
};

export function MediaView<A = {}, B = {}> (baseProps: BaseProps<A, B>) {
  return function (initialProps: A & B) {
    const { component: Component, resolveProps, unresolvedView = null } = baseProps;
    const [ resolvedProps, setResolvedProps ] = useState({} as B);
    const [ propsResolved, setPropsResolved ] = useState(false);
    const transport = useTransportContext();

    useEffect(() => {
      console.log('Resolving props of media view');

      async function doResolveProps () {
        if (typeof resolveProps === 'function') {
          const resolverProps = { ...initialProps, transport };
          setResolvedProps(await resolveProps(resolverProps));
        }
        setPropsResolved(true);
      }

      if (!transport) {
        console.log('ERROR: transport is not defined');
      } else if (!propsResolved) {
        doResolveProps();
      }
    }, [ false ]);
    
    return propsResolved
      ? <Component {...initialProps} {...resolvedProps} />
      : unresolvedView;
  }
}
