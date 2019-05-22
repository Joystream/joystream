import React from 'react';
import { Message } from 'semantic-ui-react';
import { Link } from 'react-router-dom';

import { Option } from '@polkadot/types';
import { withCalls, withMulti } from '@polkadot/ui-api/with';

import { MemberId } from '@polkadot/joy-members/types';
import { queryMembershipToProp } from '@polkadot/joy-members/utils';
import { useMyAccount } from '@polkadot/joy-utils/MyAccountContext';

export type MyAddressProps = {
  myAddress?: string
};

export type MyAccountProps = MyAddressProps & {
  myMemberId?: MemberId,
  myMemberIdOpt?: Option<MemberId>,
  myMemberIdChecked?: boolean,
  iAmMember?: boolean
};

function withMyAddress<P extends MyAccountProps> (Component: React.ComponentType<P>) {
  return function (props: P) {
    const { state: { address } } = useMyAccount();
    return <Component myAddress={address} {...props} />;
  };
}

const withMyMemberId = withCalls<MyAccountProps>(
  queryMembershipToProp(
    'memberIdByAccountId', {
      paramName: 'myAddress',
      propName: 'myMemberIdOpt'
    }
  )
);

function withMyMembership<P extends MyAccountProps> (Component: React.ComponentType<P>) {
  return function (props: P) {
    const { myMemberIdOpt } = props;
    const myMemberIdChecked = myMemberIdOpt !== undefined;
    const myMemberId = myMemberIdOpt && myMemberIdOpt.isSome
      ? myMemberIdOpt.unwrap() : undefined;
    const iAmMember = myMemberId !== undefined;

    const newProps = {
      myMemberIdChecked,
      myMemberId,
      iAmMember
    };

    return <Component {...props} {...newProps} />;
  };
}

export const withMyAccount = <P extends MyAccountProps> (Component: React.ComponentType<P>) =>
withMulti(
  Component,
  withMyAddress,
  withMyMemberId,
  withMyMembership
);

function OnlyMembers<P extends MyAccountProps> (Component: React.ComponentType<P>) {
  return function (props: P) {
    const { myMemberIdChecked, iAmMember } = props;
    if (!myMemberIdChecked) {
      return <em>Loading...</em>;
    } else if (iAmMember) {
      return <Component {...props} />;
    } else {
      return (
        <Message warning className='JoyMainStatus'>
          <Message.Header>Only members can access this functionality.</Message.Header>
          <div style={{ marginTop: '1rem' }}>
            <Link to={`/members/edit`} className='ui button orange'>Register here</Link>
            <span style={{ margin: '0 .5rem' }}> or </span>
            <Link to={`/accounts`} className='ui button'>Change key</Link>
          </div>
        </Message>
      );
    }
  };
}

export const withOnlyMembers = <P extends MyAccountProps> (Component: React.ComponentType<P>) =>
withMulti(
  Component,
  withMyAccount,
  OnlyMembers
);
