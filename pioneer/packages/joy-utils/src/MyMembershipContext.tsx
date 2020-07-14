import React, { createContext, useContext } from 'react';
import { MyAccountProps, withMyAccount } from './MyAccount';

export const MyMembershipContext = createContext<MyAccountProps>({});

function InnerMyMembershipProvider (props: React.PropsWithChildren<MyAccountProps>) {
  return (
    <MyMembershipContext.Provider value={props}>
      {props.children}
    </MyMembershipContext.Provider>
  );
}

export const MyMembershipProvider = withMyAccount(InnerMyMembershipProvider);

export function useMyMembership () {
  return useContext(MyMembershipContext);
}
