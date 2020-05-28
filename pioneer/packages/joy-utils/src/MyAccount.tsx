import React from 'react';
import { Message } from 'semantic-ui-react';
import { Link } from 'react-router-dom';

import { AccountId } from '@polkadot/types/interfaces';
import { Vec, GenericAccountId, Option } from '@polkadot/types';
import accountObservable from '@polkadot/ui-keyring/observable/accounts';
import { withCalls, withMulti, withObservable } from '@polkadot/react-api/index';
import { SubjectInfo } from '@polkadot/ui-keyring/observable/types';

import { MemberId, Profile } from '@joystream/types/members';
import { CuratorId, LeadId, Lead, CurationActor, Curator } from '@joystream/types/content-working-group';

import { queryMembershipToProp } from '@polkadot/joy-members/utils';
import { useMyAccount } from '@polkadot/joy-utils/MyAccountContext';
import { queryToProp, MultipleLinkedMapEntry, SingleLinkedMapEntry } from '@polkadot/joy-utils/index';
import { useMyMembership } from './MyMembershipContext';

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
  memberProfile?: Option<any>;

  // Content Working Group
  curatorEntries?: any; // entire linked_map: CuratorId => Curator
  isLeadSet?: Option<LeadId>;
  contentLeadId?: LeadId;
  contentLeadEntry?: any; // linked_map value

  // From member's roles
  myContentLeadId?: LeadId;
  myCuratorIds?: CuratorId[];
  memberIsCurator?: boolean;
  memberIsContentLead?: boolean;

  curationActor?: any;
  allAccounts?: SubjectInfo;
};

function withMyAddress<P extends MyAccountProps> (Component: React.ComponentType<P>) {
  return function (props: P) {
    const {
      state: { address }
    } = useMyAccount();
    const myAccountId = address ? new GenericAccountId(address) : undefined;
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

const withMyProfile = withCalls<MyAccountProps>(queryMembershipToProp('memberProfile', 'myMemberId'));

const withContentWorkingGroupDetails = withCalls<MyAccountProps>(
  queryToProp('query.contentWorkingGroup.currentLeadId', { propName: 'isLeadSet' }),
  queryToProp('query.contentWorkingGroup.curatorById', { propName: 'curatorEntries' })
);

function resolveLead<P extends MyAccountProps> (Component: React.ComponentType<P>) {
  return function (props: P) {
    const { isLeadSet } = props;

    let contentLeadId;

    if (isLeadSet && isLeadSet.isSome) {
      contentLeadId = isLeadSet.unwrap();
    }

    const newProps = {
      contentLeadId
    };

    return <Component {...props} {...newProps} />;
  };
}

const resolveLeadEntry = withCalls<MyAccountProps>(
  queryToProp('query.contentWorkingGroup.leadById', { propName: 'contentLeadEntry', paramName: 'contentLeadId' })
);

const withContentWorkingGroup = <P extends MyAccountProps>(Component: React.ComponentType<P>) =>
  withMulti(Component, withContentWorkingGroupDetails, resolveLead, resolveLeadEntry);

function withMyRoles<P extends MyAccountProps> (Component: React.ComponentType<P>) {
  return function (props: P) {
    const { iAmMember, memberProfile } = props;

    let myContentLeadId;
    const myCuratorIds: Array<CuratorId> = [];

    if (iAmMember && memberProfile && memberProfile.isSome) {
      const profile = memberProfile.unwrap() as Profile;
      profile.roles.forEach(role => {
        if (role.isContentLead) {
          myContentLeadId = role.actor_id;
        } else if (role.isCurator) {
          myCuratorIds.push(role.actor_id);
        }
      });
    }

    const memberIsContentLead = myContentLeadId !== undefined;
    const memberIsCurator = myCuratorIds.length > 0;

    const newProps = {
      memberIsContentLead,
      memberIsCurator,
      myContentLeadId,
      myCuratorIds
    };

    return <Component {...props} {...newProps} />;
  };
}

const canUseAccount = (account: AccountId, allAccounts: SubjectInfo | undefined) => {
  if (!allAccounts || !Object.keys(allAccounts).length) {
    return false;
  }

  const ix = Object.keys(allAccounts).findIndex(key => {
    return account.eq(allAccounts[key].json.address);
  });

  return ix != -1;
};

function withCurationActor<P extends MyAccountProps> (Component: React.ComponentType<P>) {
  return function (props: P) {
    const {
      myAccountId,
      isLeadSet,
      contentLeadEntry,
      myCuratorIds,
      curatorEntries,
      allAccounts,
      memberIsContentLead,
      memberIsCurator
    } = props;

    if (!myAccountId || !isLeadSet || !contentLeadEntry || !curatorEntries || !allAccounts) {
      return <Component {...props} />;
    }

    const leadRoleAccount = isLeadSet.isSome
      ? new SingleLinkedMapEntry<Lead>(Lead, contentLeadEntry).value.role_account
      : null;

    // Is current key the content lead key?
    if (leadRoleAccount && leadRoleAccount.eq(myAccountId)) {
      return <Component {...props} curationActor={[new CurationActor('Lead'), myAccountId]} />;
    }

    const curators = new MultipleLinkedMapEntry<CuratorId, Curator>(CuratorId, Curator, curatorEntries);

    const correspondingCurationActor = (accountId: AccountId, curators: MultipleLinkedMapEntry<CuratorId, Curator>) => {
      const ix = curators.linked_values.findIndex(curator => myAccountId.eq(curator.role_account) && curator.is_active);

      return ix >= 0
        ? new CurationActor({
          Curator: curators.linked_keys[ix]
        })
        : null;
    };

    const firstMatchingCurationActor = correspondingCurationActor(myAccountId, curators);

    // Is the current key corresponding to an active curator role key?
    if (firstMatchingCurationActor) {
      return <Component {...props} curationActor={[firstMatchingCurationActor, myAccountId]} />;
    }

    // See if we have the member's lead role account
    if (leadRoleAccount && memberIsContentLead && canUseAccount(leadRoleAccount, allAccounts)) {
      return <Component {...props} curationActor={[new CurationActor('Lead'), leadRoleAccount]} />;
    }

    // See if we have one of the member's curator role accounts
    if (memberIsCurator && myCuratorIds && curators.linked_keys.length) {
      for (let i = 0; i < myCuratorIds.length; i++) {
        const curator_id = myCuratorIds[i];
        const ix = curators.linked_keys.findIndex(id => id.eq(curator_id));

        if (ix >= 0) {
          const curator = curators.linked_values[ix];
          if (curator.is_active && canUseAccount(curator.role_account, allAccounts)) {
            return (
              <Component
                {...props}
                curationActor={[new CurationActor({ Curator: curator_id }), curator.role_account]}
              />
            );
          }
        }
      }
    }

    // selected key doesn't have any special role, check other available keys..

    // Use lead role key if available
    if (leadRoleAccount && canUseAccount(leadRoleAccount, allAccounts)) {
      return <Component {...props} curationActor={[new CurationActor('Lead'), leadRoleAccount]} />;
    }

    // Use first available active curator role key if available
    if (curators.linked_keys.length) {
      for (let i = 0; i < curators.linked_keys.length; i++) {
        const curator = curators.linked_values[i];
        if (curator.is_active && canUseAccount(curator.role_account, allAccounts)) {
          return (
            <Component
              {...props}
              curationActor={[new CurationActor({ Curator: curators.linked_keys[i] }), curator.role_account]}
            />
          );
        }
      }
    }

    // we don't have any key that can fulfill a curation action
    return <Component {...props} />;
  };
}

export const withMyAccount = <P extends MyAccountProps>(Component: React.ComponentType<P>) =>
  withMulti(
    Component,
    withObservable(accountObservable.subject, { propName: 'allAccounts' }),
    withMyAddress,
    withMyMemberIds,
    withMyMembership,
    withMyProfile,
    withContentWorkingGroup,
    withMyRoles,
    withCurationActor
  );

export function MembershipRequired<P extends {}> (Component: React.ComponentType<P>): React.ComponentType<P> {
  return function (props: P) {
    const { myMemberIdChecked, iAmMember } = useMyMembership();

    if (!myMemberIdChecked) {
      return <em>Loading...</em>;
    } else if (iAmMember) {
      return <Component {...props} />;
    }

    return (
      <Message warning className="JoyMainStatus">
        <Message.Header>Only members can access this functionality.</Message.Header>
        <div style={{ marginTop: '1rem' }}>
          <Link to={'/members/edit'} className="ui button orange">
            Register here
          </Link>
          <span style={{ margin: '0 .5rem' }}> or </span>
          <Link to={'/accounts'} className="ui button">
            Change key
          </Link>
        </div>
      </Message>
    );
  };
}

export function AccountRequired<P extends {}> (Component: React.ComponentType<P>): React.ComponentType<P> {
  return function (props: P) {
    const { allAccounts } = useMyMembership();

    if (allAccounts && !Object.keys(allAccounts).length) {
      return (
        <Message warning className="JoyMainStatus">
          <Message.Header>Please create a key to get started.</Message.Header>
          <div style={{ marginTop: '1rem' }}>
            <Link to={'/accounts'} className="ui button orange">
              Create key
            </Link>
          </div>
        </Message>
      );
    }

    return <Component {...props} />;
  };
}

// TODO: We could probably use withAccountRequired, which wouldn't pass any addiotional props, just like withMembershipRequired.
// Just need to make sure those passed props are not used in the extended components (they probably aren't).
export const withOnlyAccounts = <P extends MyAccountProps>(Component: React.ComponentType<P>): React.ComponentType<P> =>
  withMulti(Component, withMyAccount, AccountRequired);

export const withMembershipRequired = <P extends {}> (Component: React.ComponentType<P>): React.ComponentType<P> =>
  withMulti(Component, AccountRequired, MembershipRequired);

export const withOnlyMembers = <P extends MyAccountProps>(Component: React.ComponentType<P>): React.ComponentType<P> =>
  withMulti(Component, withMyAccount, withMembershipRequired);
