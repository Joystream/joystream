import React from 'react';
import { Button, Card, Icon, Message, SemanticICONS } from 'semantic-ui-react';
import { Link } from 'react-router-dom';

import { GroupLeadView, GroupMember, GroupMemberView, GroupLead } from '../elements';
import { Loadable } from '@polkadot/joy-utils/index';

import { WorkingGroups } from '../working_groups';
import styled from 'styled-components';
import _ from 'lodash';

export type WorkingGroupMembership = {
  leadStatus: GroupLeadStatus;
  workers: GroupMember[];
  workerRolesAvailable: boolean;
  leadRolesAvailable: boolean;
}

const NoRolesAvailable = () => (
  <Message info>
    <Message.Header>No open roles at the moment</Message.Header>
    <p>The team is full at the moment, but we intend to expand. Check back for open roles soon!</p>
  </Message>
);

type JoinRoleProps = {
  group: WorkingGroups;
  title: string;
  description: string;
  lead?: boolean;
};

const JoinRole = ({ group, lead = false, title, description }: JoinRoleProps) => (
  <Message positive>
    <Message.Header>{title}</Message.Header>
    <p>{description}</p>
    <Link to={`/working-groups/opportunities/${group}${lead ? '/lead' : ''}`}>
      <Button icon labelPosition="right" color="green" positive>
        Find out more
        <Icon name={'right arrow' as SemanticICONS} />
      </Button>
    </Link>
  </Message>
);

const GroupOverviewSection = styled.section`
  padding: 2rem;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 3px;

  & .staked-card {
    margin-right: 1.2em !important;
  }

  & .cards {
    margin-top: 1em;
    margin-bottom: 1em;
  }
`;

type GroupOverviewOuterProps = Partial<WorkingGroupMembership> & {
  leadStatus?: GroupLeadStatus;
}

type GroupOverviewProps = GroupOverviewOuterProps & {
  group: WorkingGroups;
  description: string;
  customGroupName?: string;
  customJoinTitle?: string;
  customJoinDesc?: string;
  customBecomeLeadTitle?: string;
  customBecomeLeadDesc?: string;
}

const GroupOverview = Loadable<GroupOverviewProps>(
  ['workers', 'leadStatus'],
  ({
    group,
    description,
    workers,
    leadStatus,
    workerRolesAvailable,
    leadRolesAvailable,
    customGroupName,
    customJoinTitle,
    customJoinDesc,
    customBecomeLeadTitle,
    customBecomeLeadDesc
  }: GroupOverviewProps) => {
    const groupName = customGroupName || _.startCase(group);
    const joinTitle = customJoinTitle || `Join the ${groupName} group!`;
    const joinDesc = customJoinDesc || `There are openings for new ${groupName}. This is a great way to support Joystream!`;
    const becomeLeadTitle = customBecomeLeadTitle || `Become ${groupName} Lead!`;
    const becomeLeadDesc = customBecomeLeadDesc || `An opportunity to become ${groupName} Leader is currently available! This is a great way to support Joystream!`;
    return (
      <GroupOverviewSection>
        <h2>{ groupName }</h2>
        <p>{ description }</p>
        <Card.Group style={{ alignItems: 'flex-start' }}>
          { workers!.map((worker, key) => (
            <GroupMemberView key={key} {...worker} />
          )) }
        </Card.Group>
        { workerRolesAvailable
          ? <JoinRole group={group} title={joinTitle} description={joinDesc} />
          : <NoRolesAvailable /> }
        { leadStatus && <CurrentLead groupName={groupName} {...leadStatus}/> }
        { leadRolesAvailable && <JoinRole group={group} lead title={becomeLeadTitle} description={becomeLeadDesc} /> }
      </GroupOverviewSection>
    );
  }
);

export const ContentCurators = (props: GroupOverviewOuterProps) => (
  <GroupOverview
    group={WorkingGroups.ContentCurators}
    description={
      'Content Curators are responsible for ensuring that all content is uploaded correctly ' +
      'and in line with the terms of service.'
    }
    {...props}
  />
);

export const StorageProviders = (props: GroupOverviewOuterProps) => (
  <GroupOverview
    group={WorkingGroups.StorageProviders}
    description={
      'Storage Providers are responsible for storing and providing platform content!'
    }
    {...props}
  />
);

const LeadSection = styled.div`
  margin-top: 1rem;
`;

export type GroupLeadStatus = {
  lead?: GroupLead;
  loaded: boolean;
}

type CurrentLeadProps = GroupLeadStatus & {
  groupName: string;
  customLeadDesc?: string;
};

export const CurrentLead = Loadable<CurrentLeadProps>(
  ['loaded'],
  ({ customLeadDesc, groupName, lead }: CurrentLeadProps) => {
    const leadDesc = customLeadDesc || `This role is responsible for hiring ${groupName}.`;
    return (
      <LeadSection>
        <Message>
          <Message.Header>{ groupName } Lead</Message.Header>
          <p>{ leadDesc }</p>
          {lead
            ? <Card.Group><GroupLeadView {...lead} /></Card.Group>
            : `There is no active ${groupName} Lead assigned.` }
        </Message>
      </LeadSection>
    );
  }
);
