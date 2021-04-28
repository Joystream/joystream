import React, { useContext } from 'react';

import { AccountId } from '@polkadot/types/interfaces';
import { Vec } from '@polkadot/types';
import { keyring } from '@polkadot/ui-keyring';
import { withCalls, withMulti, withObservable, ApiContext } from '@polkadot/react-api/index';
import { SubjectInfo } from '@polkadot/ui-keyring/observable/types';

import { MemberId, Membership } from '@joystream/types/members';

import { queryMembershipToProp } from '@polkadot/joy-members/utils';
import useMyAccount from '../hooks/useMyAccount';
import { componentName } from '../helpers';

export type MyAddressProps = {
  myAddress?: string;
};

export type MyAccountProps = MyAddressProps & {
  myAccountId?: AccountId;
  myMemberId?: MemberId;
  memberIdsByRootAccountId?: Vec<MemberId>;
  memberIdsByControllerAccountId?: Vec<MemberId>;
  myMemberIdChecked?: boolean;
  iAmMember?: boolean;
  myMembership?: Membership | null;
  allAccounts?: SubjectInfo;
};

function withMyAddress<P extends MyAccountProps> (Component: React.ComponentType<P>) {
  const ResultComponent: React.FunctionComponent<P> = (props: P) => {
    const {
      state: { address }
    } = useMyAccount();
    const { api } = useContext(ApiContext);
    const myAccountId = (address && api.isReady)
      ? api.createType('AccountId', address)
      : undefined;

    return <Component myAddress={address} myAccountId={myAccountId} {...props} />;
  };

  ResultComponent.displayName = `withMyAddress(${componentName(Component)})`;

  return ResultComponent;
}

const withMyMemberIds = withCalls<MyAccountProps>(
  queryMembershipToProp('memberIdsByRootAccountId', 'myAddress'),
  queryMembershipToProp('memberIdsByControllerAccountId', 'myAddress')
);

function withMyMembership<P extends MyAccountProps> (Component: React.ComponentType<P>) {
  const ResultComponent: React.FunctionComponent<P> = (props: P) => {
    const { memberIdsByRootAccountId, memberIdsByControllerAccountId } = props;

    const myMemberIdChecked = memberIdsByRootAccountId && memberIdsByControllerAccountId;

    let myMemberId: MemberId | undefined;

    if (memberIdsByRootAccountId && memberIdsByControllerAccountId) {
      const [memberIdByAccount] = memberIdsByRootAccountId.toArray().concat(memberIdsByControllerAccountId.toArray());

      myMemberId = memberIdByAccount;
    }

    const iAmMember = myMemberId !== undefined;

    const newProps = {
      myMemberIdChecked,
      myMemberId,
      iAmMember
    };

    return <Component {...props} {...newProps} />;
  };

  ResultComponent.displayName = `withMyMembership(${componentName(Component)})`;

  return ResultComponent;
}

function resolveMyProfile<P extends { myMembership?: Membership | null }> (Component: React.ComponentType<P>) {
  const ResultComponent: React.FunctionComponent<P> = (props: P) => {
    let { myMembership } = props;

    myMembership = (!myMembership || myMembership.handle.isEmpty) ? null : myMembership;

    return <Component {...props} myMembership={ myMembership } />;
  };

  ResultComponent.displayName = `resolveMyProfile(${componentName(Component)})`;

  return ResultComponent;
}

const withMyProfileCall = withCalls<MyAccountProps>(queryMembershipToProp('membershipById', {
  paramName: 'myMemberId',
  propName: 'myMembership'
}));

const withMyProfile = <P extends MyAccountProps>(Component: React.ComponentType<P>) =>
  withMulti(Component, withMyProfileCall, resolveMyProfile);

export const withMyAccount = <P extends MyAccountProps>(Component: React.ComponentType<P>) =>
  withMulti(
    Component,
    withObservable(keyring.accounts.subject, { propName: 'allAccounts' }),
    withMyAddress,
    withMyMemberIds,
    withMyMembership,
    withMyProfile
  );
