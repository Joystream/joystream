import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Button,
  Container,
  Icon,
  Form,
  Grid,
  Label,
  List,
  Message,
  Modal,
  Segment,
  Statistic,
  Table,
  SemanticICONS
} from 'semantic-ui-react';

import { formatBalance } from '@polkadot/util';
import { u128 } from '@polkadot/types';
import { Balance } from '@polkadot/types/interfaces';

import { Loadable } from '@polkadot/joy-utils/index';
import { Opening } from '@joystream/types/hiring';

import {
  OpeningBodyReviewInProgress
} from './Opportunities';
import {
  openingIcon,
  openingDescription
} from '../openingStateMarkup';
import { CancelledReason, OpeningStageClassification, OpeningState } from '../classifiers';
import { OpeningMetadata } from '../OpeningMetadata';
import { CuratorId } from '@joystream/types/content-working-group';
import { WorkerId } from '@joystream/types/working-group';
import _ from 'lodash';
import styled from 'styled-components';
import { WorkingGroups } from '../working_groups';

type CTACallback = (rationale: string) => void

type CTA = {
  title: string;
  callback: CTACallback;
}

function CTAButton (props: CTA) {
  const [open, setOpen] = useState<boolean>(false);
  const [rationale, setRationale] = useState<string>('');
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const leaveRole = () => {
    props.callback(rationale);
    handleClose();
  };
  const handleChange = (e: any, value: any) => setRationale(value.value);

  return (
    <Modal trigger={
      <Button negative icon labelPosition='left' onClick={handleOpen}>
        <Icon name='warning sign' />
        {props.title}
      </Button>
    }
    open={open}
    onClose={handleClose}
    >
      <Modal.Header>Are you sure you want to leave this role?</Modal.Header>
      <Modal.Content>
        <Message warning>
          This operation cannot be reversed!
        </Message>
        <Form>
          <Form.TextArea label='Rationale'
            placeholder='(optional) Reason for withdrawing'
            value={rationale}
            onChange={handleChange}
          />
        </Form>
      </Modal.Content>
      <Modal.Actions>
        <Button onClick={handleClose}>
          Cancel
        </Button>
        <Button color='yellow' onClick={leaveRole} negative>
          Leave role
        </Button>
      </Modal.Actions>
    </Modal>
  );
}

interface NameAndURL {
  name: string;
  url?: string;
}

function RoleName (props: NameAndURL) {
  if (typeof props.url !== 'undefined') {
    return <Link to={props.url}>{props.name}</Link>;
  }
  return <span>{props.name}</span>;
}

export interface ActiveRole extends NameAndURL {
  workerId: CuratorId | WorkerId;
  reward: Balance;
  stake: Balance;
  group: WorkingGroups;
}

export interface ActiveRoleWithCTAs extends ActiveRole {
  CTAs: CTA[];
}

export type CurrentRolesProps = {
  currentRoles: ActiveRoleWithCTAs[];
}

export const CurrentRoles = Loadable<CurrentRolesProps>(
  ['currentRoles'],
  props => {
    return (
      <Container className="current-roles">
        <h2>Current roles</h2>
        {props.currentRoles.length > 0 &&
          <Table basic='very'>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Role</Table.HeaderCell>
                <Table.HeaderCell>Worker / Curator ID</Table.HeaderCell>
                <Table.HeaderCell>Earned</Table.HeaderCell>
                <Table.HeaderCell>Stake</Table.HeaderCell>
                <Table.HeaderCell></Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {props.currentRoles.map((role, key) => (
                <Table.Row key={key}>
                  <Table.Cell>
                    <RoleName name={role.name} url={role.url} />
                  </Table.Cell>
                  <Table.Cell>
                    {role.workerId.toString()}
                  </Table.Cell>
                  <Table.Cell>
                    {formatBalance(role.reward)}
                  </Table.Cell>
                  <Table.Cell>
                    {formatBalance(role.stake)}
                  </Table.Cell>
                  <Table.Cell>
                    {role.CTAs.map((cta, key2) => (
                      <CTAButton {...cta} key={key2} />
                    ))}
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        }
        {props.currentRoles.length === 0 &&
          <p>You are not currently in any working group roles.</p>
        }
      </Container>
    );
  });

type RankAndCapacityProps = {
  rank: number;
  capacity: number;
}

function RankAndCapacity (props: RankAndCapacityProps) {
  let capacity = null;
  if (props.capacity > 0) {
    capacity = '/ ' + props.capacity;
  }

  let iconName: SemanticICONS = 'check circle';
  if (props.capacity > 0 && props.rank > props.capacity) {
    iconName = 'times circle';
  }
  return (
    <span>
      <Icon name={iconName} />
      Your rank: {props.rank} {capacity}
    </span>
  );
}

export type ApplicationStatusProps = RankAndCapacityProps & {
  openingStatus: OpeningState;
  cancelledReason?: CancelledReason;
  hired?: boolean;
}

const cancelledReasons = new Map<CancelledReason, string>([
  [CancelledReason.ApplicantCancelled, 'You withdrew from this this application'],
  [CancelledReason.HirerCancelledApplication, 'Your application was cancelled by the group lead'],
  [CancelledReason.HirerCancelledOpening, 'The role was cancelled by the group lead'],
  [CancelledReason.NoOneHired, 'The group lead didn\'t hire anyone during the maximum review period']
]);

function ApplicationCancelledStatus (props: ApplicationStatusProps) {
  return (
    <Message>
      <Message.Header>
        <Icon name='ban' />
        Cancelled
      </Message.Header>
      <p>{cancelledReasons.get(props.cancelledReason as CancelledReason)}.</p>
    </Message>
  );
}
type statusRenderer = (p: ApplicationStatusProps) => any

function ApplicationStatusAcceptingApplications (props: ApplicationStatusProps): any {
  let positive = true;
  let message = (
    <p>When the review period begins, you will be considered for this role. </p>
  );

  if (props.capacity > 0 && props.rank > props.capacity) {
    positive = false;
    message = (
      <p>You have been crowded out of this role, and will not be considered.</p>
    );
  }
  return (
    <Message positive={positive} negative={!positive}>
      <Message.Header>
        <RankAndCapacity rank={props.rank} capacity={props.capacity} />
      </Message.Header>
      {message}
    </Message>
  );
}

function ApplicationStatusInReview (props: ApplicationStatusProps): any {
  let positive = true;
  let message = (
    <p>You are being considered for this role. </p>
  );

  if (props.capacity > 0 && props.rank > props.capacity) {
    positive = false;
    message = (
      <p>You have been crowded out of this role, and will not be considered.</p>
    );
  }
  return (
    <Message positive={positive} negative={!positive}>
      <Message.Header>
        <RankAndCapacity rank={props.rank} capacity={props.capacity} />
      </Message.Header>
      {message}
    </Message>
  );
}

function ApplicationStatusComplete (props: ApplicationStatusProps): any {
  return (
    <Message negative>
      <Message.Header>
        <Icon name='thumbs down outline' />
        Application unsuccessful
      </Message.Header>
      <p>You were not hired for this role.</p>
    </Message>
  );
}

function ApplicationStatusHired (props: ApplicationStatusProps) {
  return (
    <Message positive>
      <Message.Header>
        <Icon name='thumbs up outline' />
        Application successful!
      </Message.Header>
      <p>You were hired for this role.</p>
    </Message>
  );
}

const applicationStatusRenderers = new Map<OpeningState, statusRenderer>([
  [OpeningState.AcceptingApplications, ApplicationStatusAcceptingApplications],
  [OpeningState.InReview, ApplicationStatusInReview],
  [OpeningState.Complete, ApplicationStatusComplete]
]);

export function ApplicationStatus (props: ApplicationStatusProps) {
  if (typeof props.hired !== 'undefined' && props.hired) {
    return ApplicationStatusHired(props);
  } else if (typeof props.cancelledReason !== 'undefined') {
    return ApplicationCancelledStatus(props);
  }

  return (applicationStatusRenderers.get(props.openingStatus) as statusRenderer)(props);
}

enum ApplicationState {
  Positive = 0,
  Negative,
  Cancelled,
}

const applicationClass = new Map<ApplicationState, string>([
  [ApplicationState.Positive, 'positive'],
  [ApplicationState.Negative, 'negative'],
  [ApplicationState.Cancelled, 'cancelled']
]);

function applicationState (props: OpeningApplication): ApplicationState {
  if (typeof props.cancelledReason !== 'undefined') {
    return ApplicationState.Cancelled;
  } else if (props.capacity > 0 && props.rank > props.capacity) {
    return ApplicationState.Negative;
  }
  return ApplicationState.Positive;
}

export type OpeningApplication = {
  id: number;
  rank: number;
  capacity: number;
  cancelledReason?: CancelledReason;
  hired?: boolean;
  stage: OpeningStageClassification;
  opening: Opening;
  meta: OpeningMetadata;
  applicationStake: Balance;
  roleStake: Balance;
  review_end_time?: Date;
  review_end_block?: number;
}

export type CancelCallback = {
  cancelCallback: (app: OpeningApplication) => void;
}

export type ApplicationProps = OpeningApplication & CancelCallback

function CancelButton (props: ApplicationProps) {
  const [open, setOpen] = useState<boolean>(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const cancelApplication = () => {
    props.cancelCallback(props);
    handleClose();
  };

  return (
    <Modal trigger={
      <Button fluid
        icon
        labelPosition='left'
        negative
        className='cta'
        onClick={handleOpen}
      >
        <Icon name='warning sign' />
        Cancel and withdraw stake
      </Button>
    }
    open={open}
    onClose={handleClose}
    >
      <Modal.Header>Are you sure you want to cancel this application?</Modal.Header>
      <Modal.Content>
        <Message warning>
          This operation cannot be reversed!
        </Message>
      </Modal.Content>
      <Modal.Actions>
        <Button onClick={handleClose}>
          Cancel
        </Button>
        <Button color='yellow' onClick={cancelApplication} negative>
          Cancel application
        </Button>
      </Modal.Actions>

    </Modal>
  );
}

const ApplicationLabel = styled(Label)`
  margin-left: 1em !important;
  border: 1px solid #999 !important;
`;

export function Application (props: ApplicationProps) {
  let countdown = null;
  if (props.stage.state === OpeningState.InReview) {
    countdown = <OpeningBodyReviewInProgress {...props.stage} />;
  }

  const application = props.opening.parse_human_readable_text_with_fallback();
  const appState = applicationState(props);
  const isLeadApplication = props.meta.type?.isOfType('Leader');

  let CTA = null;
  if (appState === ApplicationState.Positive && props.stage.state !== OpeningState.Complete) {
    CTA = <CancelButton {...props} />;
  }

  return (
    <Segment className={'application status-' + applicationClass.get(appState)}>
      <Label attached='top'>
        {application.job.title}
        <Label.Detail className="right">
          {openingIcon(props.stage.state)}
          {openingDescription(props.stage.state)}
          <Icon name="hashtag" style={{ marginLeft: '0.75em' }}/>
          { props.id }
          <ApplicationLabel>
            {_.startCase(props.meta.group) + (isLeadApplication ? ' Lead' : '')}
          </ApplicationLabel>
        </Label.Detail>
      </Label>
      <Grid columns="equal">
        <Grid.Column width={10}>
          <Label ribbon className="masthead">
            <Statistic size='tiny'>
              <Statistic.Label>Reward</Statistic.Label>
              <Statistic.Value>{application.reward}</Statistic.Value>
            </Statistic>
          </Label>
          <div className="summary">
            <p>{application.headline}</p>
          </div>

          <h4>Your stakes</h4>
          <Table basic='very'>
            <Table.Body>
              <Table.Row>
                <Table.Cell>
                  Application stake
                </Table.Cell>
                <Table.Cell>
                  {formatBalance(props.applicationStake)}
                </Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.Cell>
                  Role stake
                </Table.Cell>
                <Table.Cell>
                  {formatBalance(props.roleStake)}
                </Table.Cell>
              </Table.Row>
              <Table.Row className="sum">
                <Table.Cell>
                  Total stake
                </Table.Cell>
                <Table.Cell>
                  {formatBalance(new u128(props.roleStake.add(props.applicationStake)))}
                </Table.Cell>
              </Table.Row>
            </Table.Body>
          </Table>
          <h4>Hiring process details</h4>
          <List bulleted>
            {application.process && application.process.details.map((detail: string, key: any) => (
              <List.Item key={key}>
                <List.Icon name="info circle" />
                <List.Content>{detail}</List.Content>
              </List.Item>
            ))}
          </List>

        </Grid.Column>
        <Grid.Column width={6} className="details">
          <ApplicationStatus
            openingStatus={props.stage.state}
            rank={props.rank}
            capacity={props.capacity}
            cancelledReason={props.cancelledReason}
            hired={props.hired}
          />

          {countdown}
          {CTA}
        </Grid.Column>
      </Grid>
    </Segment>
  );
}

export type ApplicationsProps = CancelCallback & {
  applications: OpeningApplication[];
}

export const Applications = Loadable<ApplicationsProps>(
  ['applications'],
  props => (
    <Container className="current-applications">
      <h2>Applications</h2>
      {props.applications.map((app, key) => (
        <Application key={key} cancelCallback={props.cancelCallback} {...app} />
      ))}
      {props.applications.length === 0 &&
        <p>You have no active applications.</p>
      }
    </Container>
  )
);
