import React from 'react';
import { Message } from 'semantic-ui-react';
import { Link } from 'react-router-dom';
import { AccountId } from '@polkadot/types/interfaces';
import { withMulti, withCalls } from '@polkadot/react-api/index';
import { useMyMembership, useMyAccount } from '../hooks';
import { componentName } from '../helpers';
import { withMyAccount, MyAccountProps } from './accounts';

export function MembershipRequired<P extends Record<string, unknown>> (Component: React.ComponentType<P>): React.ComponentType<P> {
  const ResultComponent: React.FunctionComponent<P> = (props: P) => {
    const { myMemberIdChecked, iAmMember } = useMyMembership();

    if (!myMemberIdChecked) {
      return <em>Loading...</em>;
    } else if (iAmMember) {
      return <Component {...props} />;
    }

    return (
      <Message warning className='JoyMainStatus'>
        <Message.Header>Only members can access this functionality.</Message.Header>
        <div style={{ marginTop: '1rem' }}>
          <Link to={'/members/edit'} className='ui button orange'>
            Register here
          </Link>
          <span style={{ margin: '0 .5rem' }}> or </span>
          <Link to={'/accounts'} className='ui button'>
            Change key
          </Link>
        </div>
      </Message>
    );
  };

  ResultComponent.displayName = `MembershipRequired(${componentName(Component)})`;

  return ResultComponent;
}

export function AccountRequired<P extends Record<string, unknown>> (Component: React.ComponentType<P>): React.ComponentType<P> {
  const ResultComponent: React.FunctionComponent<P> = (props: P) => {
    const { allAccounts } = useMyMembership();

    if (allAccounts && !Object.keys(allAccounts).length) {
      return (
        <Message warning className='JoyMainStatus'>
          <Message.Header>Please create a key to get started.</Message.Header>
          <div style={{ marginTop: '1rem' }}>
            <Link to={'/accounts'} className='ui button orange'>
              Create key
            </Link>
          </div>
        </Message>
      );
    }

    return <Component {...props} />;
  };

  ResultComponent.displayName = `AccountRequired(${componentName(Component)})`;

  return ResultComponent;
}

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

// TODO: We could probably use withAccountRequired, which wouldn't pass any addiotional props, just like withMembershipRequired.
// Just need to make sure those passed props are not used in the extended components (they probably aren't).
export const withOnlyAccounts = <P extends MyAccountProps>(Component: React.ComponentType<P>): React.ComponentType<P> =>
  withMulti(Component, withMyAccount, AccountRequired);

export const withMembershipRequired = <P extends Record<string, unknown>> (Component: React.ComponentType<P>): React.ComponentType<P> =>
  withMulti(Component, AccountRequired, MembershipRequired);

export const withOnlyMembers = <P extends MyAccountProps>(Component: React.ComponentType<P>): React.ComponentType<P> =>
  withMulti(Component, withMyAccount, withMembershipRequired);

export const withOnlySudo = <P extends OnlySudoProps> (Component: React.ComponentType<P>) =>
  withMulti(
    Component,
    withCalls(['query.sudo.key', { propName: 'sudo' }]),
    OnlySudo
  );
