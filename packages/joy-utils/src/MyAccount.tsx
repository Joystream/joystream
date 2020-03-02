import React from 'react';
import { Message } from 'semantic-ui-react';
import { Link } from 'react-router-dom';

import { AccountId } from '@polkadot/types/interfaces';
import { Vec, GenericAccountId } from '@polkadot/types';
import { withCalls, withMulti } from '@polkadot/react-api/with';

import { MemberId } from '@joystream/types/members';
import { queryMembershipToProp } from '@polkadot/joy-members/utils';
import { useMyAccount } from '@polkadot/joy-utils/MyAccountContext';

export type MyAddressProps = {
  myAddress?: string
};

export type MyAccountProps = MyAddressProps & {
  myAccountId?: AccountId,
  myMemberId?: MemberId,
  memberIdsByRootAccountId?: Vec<MemberId>,
  memberIdsByControllerAccountId?: Vec<MemberId>,
  myMemberIdChecked?: boolean,
  iAmMember?: boolean
};

function withMyAddress<P extends MyAccountProps> (Component: React.ComponentType<P>) {
  return function (props: P) {
    const { state: { address } } = useMyAccount();
    const myAccountId = address ? new GenericAccountId(address) : undefined
    return <Component myAddress={address} myAccountId={myAccountId} {...props} />;
  };
}

const withMyMemberIds = withCalls<MyAccountProps>(
  queryMembershipToProp('memberIdsByRootAccountId', 'myAddress'),
  queryMembershipToProp('memberIdsByControllerAccountId', 'myAddress')
);

function withMyMembership<P extends MyAccountProps> (Component: React.ComponentType<P>) {
  return function (props: P) {
    const { memberIdsByRootAccountId, memberIdsByControllerAccountId } = props;

    const myMemberIdChecked = memberIdsByRootAccountId && memberIdsByControllerAccountId;

    let myMemberId: MemberId | undefined;
    if (memberIdsByRootAccountId && memberIdsByControllerAccountId) {
      memberIdsByRootAccountId.concat(memberIdsByControllerAccountId);
      if (memberIdsByRootAccountId.length) {
        myMemberId = memberIdsByRootAccountId[0];
      }
    }

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
  withMyMemberIds,
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
