import React, { createContext } from 'react';
import { MyAccountProps, withMyAccount } from '../hocs/accounts';

export const MyMembershipContext = createContext<MyAccountProps>({});

function InnerMyMembershipProvider (props: React.PropsWithChildren<MyAccountProps>) {
  return (
    <MyMembershipContext.Provider value={props}>
      {props.children}
    </MyMembershipContext.Provider>
  );
}

export const MyMembershipProvider = withMyAccount(InnerMyMembershipProvider);
