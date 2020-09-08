import React from 'react';
import { Message } from 'semantic-ui-react';
import { Link } from 'react-router-dom';

import { AccountId } from '@polkadot/types/interfaces';
import { Vec, GenericAccountId, Option } from '@polkadot/types';
import accountObservable from '@polkadot/ui-keyring/observable/accounts';
import { withCalls, withMulti, withObservable } from '@polkadot/react-api/index';
import { SubjectInfo } from '@polkadot/ui-keyring/observable/types';

import { MemberId, Membership } from '@joystream/types/members';
import { CuratorId, LeadId, Lead, CurationActor, Curator } from '@joystream/types/content-working-group';

import { queryMembershipToProp } from '@polkadot/joy-members/utils';
import { useMyAccount } from '@polkadot/joy-utils/MyAccountContext';
import { queryToProp, MultipleLinkedMapEntry, SingleLinkedMapEntry } from '@polkadot/joy-utils/index';
import { useMyMembership } from './MyMembershipContext';

import { componentName } from '@polkadot/joy-utils/react/helpers';

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

function withMyAddress<P extends MyAccountProps> (Component: React.ComponentType<P>) {
  const ResultComponent: React.FunctionComponent<P> = (props: P) => {
    const {
      state: { address }
    } = useMyAccount();
    const myAccountId = address ? new GenericAccountId(address) : undefined;
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

const withContentWorkingGroupDetails = withCalls<MyAccountProps>(
  queryToProp('query.contentWorkingGroup.currentLeadId', { propName: 'isLeadSet' }),
  queryToProp('query.contentWorkingGroup.curatorById', { propName: 'curatorEntries' })
);

function resolveLead<P extends MyAccountProps> (Component: React.ComponentType<P>) {
  const ResultComponent: React.FunctionComponent<P> = (props: P) => {
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
  ResultComponent.displayName = `resolveLead(${componentName(Component)})`;
  return ResultComponent;
}

const resolveLeadEntry = withCalls<MyAccountProps>(
  queryToProp('query.contentWorkingGroup.leadById', { propName: 'contentLeadEntry', paramName: 'contentLeadId' })
);

const withContentWorkingGroup = <P extends MyAccountProps>(Component: React.ComponentType<P>) =>
  withMulti(Component, withContentWorkingGroupDetails, resolveLead, resolveLeadEntry);

function withCurationActor<P extends MyAccountProps> (Component: React.ComponentType<P>) {
  const ResultComponent: React.FunctionComponent<P> = (props: P) => {
    const {
      myAccountId,
      isLeadSet,
      contentLeadEntry,
      curatorEntries,
      allAccounts
    } = props;

    if (!myAccountId || !isLeadSet || !contentLeadEntry || !curatorEntries || !allAccounts) {
      return <Component {...props} />;
    }

    let lead = isLeadSet.isSome
      ? new SingleLinkedMapEntry<Lead>(Lead, contentLeadEntry).value
      : null;

    // Ignore lead if he's not active
    // TODO: Does if ever happen if we query currentLeadById?
    if (!(lead?.stage.isOfType('Active'))) {
      lead = null;
    }

    const curators = new MultipleLinkedMapEntry(CuratorId, Curator, curatorEntries);

    const curationActorByAccount = (accountId: AccountId | string) => {
      if (lead && lead.role_account.toString() === accountId.toString()) {
        return new CurationActor({ Lead: null });
      }

      const matchingCuratorIndex = curators.linked_values.findIndex(curator =>
        curator.is_active && accountId.toString() === curator.role_account.toString()
      );

      return matchingCuratorIndex >= 0
        ? new CurationActor({
          Curator: curators.linked_keys[matchingCuratorIndex]
        })
        : null;
    };

    // First priority - currently selected account
    let actor = curationActorByAccount(myAccountId);
    let actorKey: AccountId | null = myAccountId;
    // Second priority - check other keys and find best role
    // TODO: Prioritize current member?
    // TODO: Perhaps just don't do that at all and force the user to select the correct key to avoid confision?
    if (!actor) {
      const allActorsWithKeys = Object.keys(allAccounts).map(accKey => ({
        actor: curationActorByAccount(allAccounts[accKey].json.address),
        key: new GenericAccountId(allAccounts[accKey].json.address)
      }));
      let actorWithKey = allActorsWithKeys.find(({ actor }) => actor?.isOfType('Lead'));
      if (!actorWithKey) {
        actorWithKey = allActorsWithKeys.find(({ actor }) => actor?.isOfType('Curator'));
      }
      actor = actorWithKey?.actor || null;
      actorKey = actorWithKey?.key || null;
    }

    if (actor && actorKey) {
      return <Component {...props} curationActor={[actor, actorKey]} />;
    } else {
      // we don't have any key that can fulfill a curation action
      return <Component {...props} />;
    }
  };
  ResultComponent.displayName = `withCurationActor(${componentName(Component)})`;
  return ResultComponent;
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
    withCurationActor
  );

export function MembershipRequired<P extends {}> (Component: React.ComponentType<P>): React.ComponentType<P> {
  const ResultComponent: React.FunctionComponent<P> = (props: P) => {
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
  ResultComponent.displayName = `MembershipRequired(${componentName(Component)})`;
  return ResultComponent;
}

export function AccountRequired<P extends {}> (Component: React.ComponentType<P>): React.ComponentType<P> {
  const ResultComponent: React.FunctionComponent<P> = (props: P) => {
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
