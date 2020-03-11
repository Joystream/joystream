import React from 'react';
import { Message } from 'semantic-ui-react';
import { Link } from 'react-router-dom';

import { AccountId } from '@polkadot/types/interfaces';
import { Vec, GenericAccountId, Option } from '@polkadot/types';
import accountObservable from '@polkadot/ui-keyring/observable/accounts';
import { withCalls, withMulti, withObservable } from '@polkadot/react-api/index';
import { SubjectInfo } from '@polkadot/ui-keyring/observable/types';

import { MemberId, Profile } from '@joystream/types/members';
import { CuratorId, LeadId, CurationActor, Curator } from '@joystream/types/content-working-group';

import { queryMembershipToProp } from '@polkadot/joy-members/utils';
import { useMyAccount } from '@polkadot/joy-utils/MyAccountContext';
import { queryToProp, MultipleLinkedMapEntry } from '@polkadot/joy-utils/index';

export type MyAddressProps = {
  myAddress?: string
};

export type MyAccountProps = MyAddressProps & {
  myAccountId?: AccountId,
  myMemberId?: MemberId,
  memberIdsByRootAccountId?: Vec<MemberId>,
  memberIdsByControllerAccountId?: Vec<MemberId>,
  myMemberIdChecked?: boolean,
  iAmMember?: boolean,
  memberProfile?: Option<any>,

  // Content Working Group
  curatorEntries?: any, //entire linked_map: CuratorId => Curator
  isLeadSet?: Option<LeadId>
  contentLeadId? : LeadId
  contentLeadEntry?: any // linked_map value

  // From member's roles
  myContentLeadId?: LeadId,
  myCuratorIds?: CuratorId[],
  memberIsCurator?: boolean,
  memberIsContentLead?: boolean,

  curationActor?: any,
  allAccounts?: SubjectInfo,
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
      iAmMember,
    };

    return <Component {...props} {...newProps} />;
  };
}

const withMyProfile = withCalls<MyAccountProps>(
  queryMembershipToProp('memberProfile', 'myMemberId'),
);

const withContentWorkingGroupDetails = withCalls<MyAccountProps>(
  queryToProp('query.contentWorkingGroup.currentLeadId', { propName: 'isLeadSet'}),
  queryToProp('query.contentWorkingGroup.curatorById', { propName: 'curatorEntries' }),
);

function resolveLead<P extends MyAccountProps> (Component: React.ComponentType<P>) {
  return function (props: P) {
    const { isLeadSet } = props;

    let contentLeadId;

    if (isLeadSet && isLeadSet.isSome) {
      contentLeadId = isLeadSet.unwrap()
    }

    let newProps = {
      contentLeadId
    }

    return <Component {...props} {...newProps} />;
  }
}

const resolveLeadEntry = withCalls<MyAccountProps>(
  queryToProp('query.contentWorkingGroup.leadById', { propName: 'contentLeadEntry',  paramName: 'contentLeadId' }),
);

const withContentWorkingGroup = <P extends MyAccountProps> (Component: React.ComponentType<P>) =>
withMulti(
  Component,
  withContentWorkingGroupDetails,
  resolveLead,
  resolveLeadEntry,
);

function withMyRoles<P extends MyAccountProps> (Component: React.ComponentType<P>) {
  return function (props: P) {

    const { iAmMember, memberProfile } = props;

    let myContentLeadId;
    let myCuratorIds: Array<CuratorId> = [];

    if (iAmMember && memberProfile && memberProfile.isSome) {
      const profile = memberProfile.unwrap() as Profile;
      profile.roles.forEach((role) => {
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
      myCuratorIds,
    };

    return <Component {...props} {...newProps} />;
  }
}

function withCurationActor<P extends MyAccountProps> (Component: React.ComponentType<P>) {
  return function (props: P) {

    const { myAccountId, isLeadSet, contentLeadEntry, memberIsContentLead, memberIsCurator, myCuratorIds, curatorEntries, allAccounts} = props;

    // leadEntry should be single entry otherwise we fetched the whole map?
    // should be handle that case?

    // NOTE: in all these methods we allow the selection of the correct role key for the action to be taken
    // but we don't verify that the keystore has the key. when Cliking on tx button
    // if the key is not found we get this err:
    //     Error: Unable to retrieve keypair '0x18826e7793e16f0c8aea42b3a3e2f16cb20f6445042c53af73d440cb47c69654'
    //// how do we detect this ?

    const canUseAccount = (account: AccountId) => {
      if (!allAccounts || !Object.keys(allAccounts).length) {
        return false
      }

      const ix = Object.keys(allAccounts).findIndex((key) => {
        return account.eq(allAccounts[key].json.address)
      });

      return ix != -1
    }

    const leadExists = isLeadSet && isLeadSet.isSome;

    if (leadExists && myAccountId && contentLeadEntry) {
      const lead_role_account = contentLeadEntry[0].role_account.toString();
      // my account is lead role account, or member account being used is the lead
      // maybe they have the lead role account in keystore
      if (myAccountId.eq(lead_role_account) || memberIsContentLead) {
        return <Component {...props} curationActor={[new CurationActor('Lead'), lead_role_account]} />
      }
    }

    // If member account being used and it is a curator
    // pick first curator id and associated role account
    if (memberIsCurator && myCuratorIds && curatorEntries) {
      let curator_id = myCuratorIds[0];

      let curators = new MultipleLinkedMapEntry<CuratorId, Curator>(
        CuratorId,
        Curator,
        curatorEntries
      );

      const ix = curators.linked_keys.findIndex((id) => id.eq(curator_id));

      if (ix >= 0) {
        const role_account = curators.linked_values[ix].role_account;
        if (canUseAccount(role_account)) {
          return <Component {...props} curationActor={[
            new CurationActor({ 'Curator': curator_id }),
            role_account.toString()
          ]} />;
        }
      }
    }

    if (myAccountId && curatorEntries) {
      let curators = new MultipleLinkedMapEntry<CuratorId, Curator>(
        CuratorId,
        Curator,
        curatorEntries
      );

      const ix = curators.linked_values.findIndex((curator) => myAccountId.eq(curator.role_account));

      if (ix >= 0) {
        const curator_id = curators.linked_keys[ix];
        return <Component {...props} curationActor={[
          new CurationActor({ 'Curator':  curator_id }),
          myAccountId.toString()
        ]} />
      }
    }

    return <Component {...props} />;
  }
}

export const withMyAccount = <P extends MyAccountProps> (Component: React.ComponentType<P>) =>
withMulti(
  Component,
  withObservable(accountObservable.subject, { propName: 'allAccounts' }),
  withMyAddress,
  withMyMemberIds,
  withMyMembership,
  withMyProfile,
  withContentWorkingGroup,
  withMyRoles,
  withCurationActor,
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
