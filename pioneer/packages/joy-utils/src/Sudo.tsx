import React from 'react';
import { Message } from 'semantic-ui-react';

import { AccountId } from '@polkadot/types/interfaces';
import { withCalls, withMulti } from '@polkadot/react-api/with';
import { useMyAccount } from '@polkadot/joy-utils/MyAccountContext';

type OnlySudoProps = {
  sudo?: AccountId;
};

function OnlySudo<P extends OnlySudoProps> (Component: React.ComponentType<P>) {
  return function (props: P) {
    const { sudo } = props;
    if (!sudo) {
      return <em>Loading sudo key...</em>;
    }

    const { state: { address: myAddress } } = useMyAccount();
    const iAmSudo = myAddress === sudo.toString();

    if (iAmSudo) {
      return <Component {...props} />;
    } else {
      return (
        <Message warning className='JoyMainStatus'>
          <Message.Header>Only sudo can access this functionality.</Message.Header>
        </Message>
      );
    }
  };
}

export const withOnlySudo = <P extends OnlySudoProps> (Component: React.ComponentType<P>) =>
  withMulti(
    Component,
    withCalls(['query.sudo.key', { propName: 'sudo' }]),
    OnlySudo
  );
