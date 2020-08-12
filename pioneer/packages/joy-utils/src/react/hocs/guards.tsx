import React from 'react';
import { Message } from 'semantic-ui-react';
import { Link } from 'react-router-dom';

import { AccountId } from '@polkadot/types/interfaces';
import { Vec, Option } from '@polkadot/types';
import { withMulti } from '@polkadot/react-api/index';
import { SubjectInfo } from '@polkadot/ui-keyring/observable/types';

import { MemberId, Membership } from '@joystream/types/members';
import { LeadId } from '@joystream/types/content-working-group';
import { useMyMembership } from '../hooks';
import { componentName } from '../helpers';
import { withMyAccount } from './accounts';

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

  // Content Working Group
  curatorEntries?: any; // entire linked_map: CuratorId => Curator
  isLeadSet?: Option<LeadId>;
  contentLeadId?: LeadId;
  contentLeadEntry?: any; // linked_map value

  curationActor?: any;
  allAccounts?: SubjectInfo;
};

export function MembershipRequired<P extends {}> (Component: React.ComponentType<P>): React.ComponentType<P> {
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

export function AccountRequired<P extends {}> (Component: React.ComponentType<P>): React.ComponentType<P> {
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

// TODO: We could probably use withAccountRequired, which wouldn't pass any addiotional props, just like withMembershipRequired.
// Just need to make sure those passed props are not used in the extended components (they probably aren't).
export const withOnlyAccounts = <P extends MyAccountProps>(Component: React.ComponentType<P>): React.ComponentType<P> =>
  withMulti(Component, withMyAccount, AccountRequired);

export const withMembershipRequired = <P extends {}> (Component: React.ComponentType<P>): React.ComponentType<P> =>
  withMulti(Component, AccountRequired, MembershipRequired);

export const withOnlyMembers = <P extends MyAccountProps>(Component: React.ComponentType<P>): React.ComponentType<P> =>
  withMulti(Component, withMyAccount, withMembershipRequired);
