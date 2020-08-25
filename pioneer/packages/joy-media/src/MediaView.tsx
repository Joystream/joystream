import React, { useState, useEffect } from 'react';
import { MediaTransport } from './transport';
import { MemberId } from '@joystream/types/members';
import { useMyMembership } from '@polkadot/joy-utils/react/hooks';
import { useTransportContext } from './TransportContext';
import { withMembershipRequired } from '@polkadot/joy-utils/react/hocs/guards';
import { useApi } from '@polkadot/react-hooks';
import { ApiPromise } from '@polkadot/api';

type InitialPropsWithMembership<A> = A & {
  myAddress?: string;
  myMemberId?: MemberId;
}

type ResolverProps<A> = InitialPropsWithMembership<A> & {
  transport: MediaTransport;
  api: ApiPromise;
}

type BaseProps<A, B> = {
  component: React.ComponentType<A & B>;
  unresolvedView?: React.ReactElement;
  resolveProps?: (props: ResolverProps<A>) => Promise<B>;

  /**
   * Array of property names that can trigger re-render of the view,
   * if values of such properties changed.
   */
  triggers?: (keyof A)[];

  /** Set `true` if only members should have access to this component. `false` by default. */
  membersOnly?: boolean;
}

function serializeTrigger (val: any): any {
  if (['number', 'boolean', 'string'].includes(typeof val)) {
    return val;
  } else if (typeof val === 'object' && typeof val.toString === 'function') {
    return val.toString();
  } else {
    return undefined;
  }
}

export function MediaView<A extends Record<string, unknown> = Record<string, unknown>, B extends Record<string, unknown> = Record<string, unknown>> (baseProps: BaseProps<A, B>) {
  function InnerView (initialProps: A & B) {
    const { component: Component, resolveProps, triggers = [], unresolvedView = null } = baseProps;

    const transport = useTransportContext();
    const { myAddress, myMemberId } = useMyMembership();
    const { api } = useApi();
    const resolverProps = { ...initialProps, transport, api, myAddress, myMemberId };

    const [resolvedProps, setResolvedProps] = useState({} as B);
    const [propsResolved, setPropsResolved] = useState(false);

    const initialDeps = triggers.map(propName => serializeTrigger(initialProps[propName]));
    const rerenderDeps = [...initialDeps, myAddress];

    useEffect(() => {
      async function doResolveProps () {
        if (typeof resolveProps !== 'function') return;

        console.log('Resolving props of media view');

        // Transport session allows us to cache loaded channels, entites and classes
        // during the render of this view:
        transport.openSession();
        setResolvedProps(await resolveProps(resolverProps));
        transport.closeSession();
        setPropsResolved(true);
      }

      if (!transport) {
        console.error('Transport is not defined');
      } else {
        doResolveProps();
      }
    }, rerenderDeps);

    console.log('Rerender deps of Media View:', rerenderDeps);

    const renderResolving = () => {
      return unresolvedView || <div className='ui active centered inline loader' />;
    };

    return propsResolved
      ? <Component {...initialProps} {...resolvedProps} />
      : renderResolving();
  }

  const { membersOnly = false } = baseProps;

  return membersOnly
    ? withMembershipRequired(InnerView)
    : InnerView;
}
