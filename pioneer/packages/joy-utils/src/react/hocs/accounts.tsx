import React, { useContext } from 'react';

import { AccountId } from '@polkadot/types/interfaces';
import { Vec, Option } from '@polkadot/types';
import accountObservable from '@polkadot/ui-keyring/observable/accounts';
import { withCalls, withMulti, withObservable, ApiContext } from '@polkadot/react-api/index';
import { SubjectInfo } from '@polkadot/ui-keyring/observable/types';

import { MemberId, Membership } from '@joystream/types/members';
import { LeadId, Lead } from '@joystream/types/content-working-group';

import { queryMembershipToProp } from '@polkadot/joy-members/utils';
import useMyAccount from '../hooks/useMyAccount';
import { componentName } from '../helpers';
import { queryToProp } from '@polkadot/joy-utils/functions/misc';
import { entriesByIds } from '@polkadot/joy-utils/transport/base';
import { CuratorId, Curator } from '@joystream/types/content-working-group';
import { useApi } from '@polkadot/react-hooks';
import usePromise from '../hooks/usePromise';
import { Error } from '../components/PromiseComponent';

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
  isLeadSet?: Option<LeadId>;
  contentLeadId?: LeadId;
  contentLead?: Lead; // linked_map value

  curationActor?: any;
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

/* Content Working Group */
function resolveLead<P extends MyAccountProps> (Component: React.ComponentType<P>) {
  const ResultComponent: React.FunctionComponent<P> = (props: P) => {
    const { isLeadSet } = props;

    const newProps = {
      contentLeadId: isLeadSet?.unwrapOr(undefined)
    };

    return <Component {...props} {...newProps} />;
  };
  ResultComponent.displayName = `resolveLead(${componentName(Component)})`;
  return ResultComponent;
}

const resolveLeadEntry = withCalls<MyAccountProps>(
  queryToProp('query.contentWorkingGroup.leadById', { propName: 'contentLead', paramName: 'contentLeadId' })
);

const withContentWorkingGroupDetails = withCalls<MyAccountProps>(
  queryToProp('query.contentWorkingGroup.currentLeadId', { propName: 'isLeadSet' })
);

const withContentWorkingGroup = <P extends MyAccountProps>(Component: React.ComponentType<P>) =>
  withMulti(Component, withContentWorkingGroupDetails, resolveLead, resolveLeadEntry);


function withCurationActor<P extends MyAccountProps> (Component: React.ComponentType<P>) {
  const ResultComponent: React.FunctionComponent<P> = (props: P) => {
    const {
      myAccountId,
      isLeadSet,
      contentLead,
      allAccounts
    } = props;
    const { isApiReady, api } = useApi();
    const [ curatorEntries, curatorsError, curatorsLoading ] = usePromise<[CuratorId, Curator][]>(
      () => isApiReady
        ? entriesByIds<CuratorId, Curator>(api.query.contentWorkingGroup.curatorById)
        : new Promise(resolve => resolve([])),
      [],
      [isApiReady]
    );

    if (curatorsError) {
      return <Error error={curatorsError} />;
    }

    if (!isApiReady || curatorsLoading || !myAccountId || !isLeadSet || !allAccounts) {
      return <Component {...props} />;
    }

    const lead = isLeadSet.isSome && contentLead?.stage.isOfType('Active') ? contentLead : null;

    const curationActorByAccount = (accountId: AccountId | string) => {
      if (lead && lead.role_account.toString() === accountId.toString()) {
        return api.createType('CurationActor', { Lead: null });
      }

      const matchingCuratorEntry = curatorEntries.find(([id, curator]) =>
        curator.is_active && accountId.toString() === curator.role_account.toString()
      );

      return matchingCuratorEntry
        ? api.createType('CurationActor', {
          Curator: matchingCuratorEntry[0]
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
        key: api.createType('AccountId', allAccounts[accKey].json.address)
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

const withMyProfileCall = withCalls<MyAccountProps>(queryMembershipToProp('membershipById', {
  paramName: 'myMemberId',
  propName: 'myMembership'
}));

const withMyProfile = <P extends MyAccountProps>(Component: React.ComponentType<P>) =>
  withMulti(Component, withMyProfileCall, resolveMyProfile);

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
