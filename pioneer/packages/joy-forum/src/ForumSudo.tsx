import React, { useContext, createContext } from 'react';

import { JoyError } from '@polkadot/joy-utils/react/components';
import { withMulti } from '@polkadot/react-api/hoc';

import { Option } from '@polkadot/types/codec';

import { useMyAccount } from '@polkadot/joy-utils/react/hooks';
import { AccountId } from '@polkadot/types/interfaces';

import AddressMini from '@polkadot/react-components/AddressMini';
import { withForumCalls } from './calls';

type LoadStructProps = {
  structOpt: Option<AccountId>;
};

const withLoadForumSudo = withForumCalls<LoadStructProps>(
  ['forumSudo', { propName: 'structOpt' }]
);

function innerWithOnlyForumSudo<P extends LoadStructProps> (Component: React.ComponentType<P>) {
  return function (props: P) {
    const { structOpt } = props;

    if (!structOpt) {
      return <em>Loading forum sudo...</em>;
    }

    const sudo = structOpt.isSome ? structOpt.unwrap().toString() : undefined;
    const { state: { address: myAddress } } = useMyAccount();
    const iAmForumSudo = sudo === myAddress;

    if (iAmForumSudo) {
      return <Component {...props} />;
    } else {
      return (
        <JoyError title={'Only forum sudo can access this functionality.'}>
          <div>Current forum sudo:</div>
          <div>{sudo ? <AddressMini value={sudo} /> : 'UNDEFINED'}</div>
        </JoyError>
      );
    }
  };
}

export function withOnlyForumSudo<P extends Record<string, unknown>> (Component: React.ComponentType<P>) {
  return withMulti(
    Component,
    withLoadForumSudo,
    innerWithOnlyForumSudo
  );
}

type ForumSudoContextProps = {
  forumSudo?: AccountId;
};

export const ForumSudoContext = createContext<ForumSudoContextProps>({});

export function InnerForumSudoProvider (props: React.PropsWithChildren<LoadStructProps>) {
  const { structOpt } = props;
  const forumSudo = structOpt ? structOpt.unwrapOr(undefined) : undefined;

  return (
    <ForumSudoContext.Provider value={{ forumSudo }}>
      {props.children}
    </ForumSudoContext.Provider>
  );
}

export const ForumSudoProvider = withMulti(
  InnerForumSudoProvider,
  withLoadForumSudo
);

export function useForumSudo () {
  return useContext(ForumSudoContext);
}

export const IfIAmForumSudo = (props: React.PropsWithChildren<Record<any, unknown>>) => {
  const { forumSudo } = useForumSudo();
  const { state: { address: myAddress } } = useMyAccount();
  const iAmForumSudo: boolean = forumSudo !== undefined && forumSudo.eq(myAddress);

  return iAmForumSudo ? <>{props.children}</> : null;
};
