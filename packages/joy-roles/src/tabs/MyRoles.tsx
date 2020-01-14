import React from 'react'
import { Link } from 'react-router-dom';
import {
  Button,
  Container,
  Icon,
  Grid,
  Label,
  List,
  Message,
  Segment,
  Statistic,
  Table,
  SemanticICONS,
} from 'semantic-ui-react'

import { formatBalance } from '@polkadot/util';
import { u128 } from '@polkadot/types';
import { Balance } from '@polkadot/types/interfaces';

import { Loadable } from '@polkadot/joy-utils/index'

import { GenericJoyStreamRoleSchema } from '@joystream/types/hiring/schemas/role.schema'
import { Opening } from "@joystream/types/hiring"

import {
  OpeningBodyReviewInProgress,
} from './Opportunities'
import {
  openingIcon,
  openingDescription,
} from '../openingStateMarkup'
import { GroupMember, GroupMemberView } from '../elements'
import { OpeningStageClassification, OpeningState } from "../classifiers"
import { OpeningMetadata } from "../OpeningMetadata"

type CTACallback = () => void

type CTA = {
  title: string
  callback: CTACallback
}

function CTAButton(props: CTA) {
  return (
    <Button negative icon labelPosition='left' onClick={props.callback}>
      <Icon name='warning sign' />
      {props.title}
    </Button>
  )
}

interface nameAndURL {
  name: string
  url?: string
}

function RoleName(props: nameAndURL) {
  if (typeof props.url !== 'undefined') {
    return <Link to={props.url}>{props.name}</Link>
  }
  return <span>{props.name}</span>
}

export interface ActiveRole extends nameAndURL {
  reward: string
  stake: Balance
}

export interface ActiveRoleWithCTAs extends ActiveRole {
  CTAs: CTA[]
}

export type CurrentRolesProps = {
  currentRoles: ActiveRoleWithCTAs[]
}

export const CurrentRoles = Loadable<CurrentRolesProps>(
  ['currentRoles'],
  props => {
    if (props.currentRoles.length === 0) {
      return null
    }

    return (
      <Container className="current-roles">
        <h2>Current roles</h2>
        <Table basic='very'>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Role</Table.HeaderCell>
              <Table.HeaderCell>Reward</Table.HeaderCell>
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
                  {role.reward}
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
      </Container>
    )
  })

type RankAndCapacityProps = {
  rank: number
  capacity: number
}

function RankAndCapacity(props: RankAndCapacityProps) {
  let capacity = null
  if (props.capacity > 0) {
    capacity = "/ " + props.capacity
  }

  let iconName: SemanticICONS = 'check circle'
  if (props.capacity > 0 && props.rank > props.capacity) {
    iconName = 'times circle'
  }
  return (
    <span>
      <Icon name={iconName} />
      Your rank: {props.rank} {capacity}
    </span>
  )
}

export enum CancelledReason {
  ApplicantCancelled = 0,
  HirerCancelledApplication,
  HirerCancelledOpening,
  NoOneHired,
}

export type ApplicationStatusProps = RankAndCapacityProps & {
  openingStatus: OpeningState
  cancelledReason?: CancelledReason
  hired?: boolean
}

const cancelledReasons = new Map<CancelledReason, string>([
  [CancelledReason.ApplicantCancelled, 'You withdrew from this this application'],
  [CancelledReason.HirerCancelledApplication, 'Your application was cancelled by the group lead'],
  [CancelledReason.HirerCancelledOpening, 'The role was cancelled by the group lead'],
  [CancelledReason.NoOneHired, 'The group lead didn\'t hire anyone during the maximum review period'],
])

function ApplicationCancelledStatus(props: ApplicationStatusProps) {
  return (
    <Message>
      <Message.Header>
        <Icon name='ban' />
        Cancelled
      </Message.Header>
      <p>{cancelledReasons.get(props.cancelledReason as CancelledReason)}.</p>
    </Message>
  )
}
type statusRenderer = (p: ApplicationStatusProps) => any

const applicationStatusRenderers = new Map<OpeningState, statusRenderer>([
  [OpeningState.AcceptingApplications, ApplicationStatusAcceptingApplications],
  [OpeningState.InReview, ApplicationStatusInReview],
  [OpeningState.Complete, ApplicationStatusComplete],
])

function ApplicationStatusAcceptingApplications(props: ApplicationStatusProps): any {
  let positive = true
  let message = (
    <p>When the review period begins, you will be considered for this role. </p>
  )

  if (props.capacity > 0 && props.rank > props.capacity) {
    positive = false
    message = (
      <p>You have been crowded out of this role, and will not be considered.</p>
    )
  }
  return (
    <Message positive={positive} negative={!positive}>
      <Message.Header>
        <RankAndCapacity rank={props.rank} capacity={props.capacity} />
      </Message.Header>
      {message}
    </Message>
  )
}

function ApplicationStatusInReview(props: ApplicationStatusProps): any {
  let positive = true
  let message = (
    <p>You are being considered for this role. </p>
  )

  if (props.capacity > 0 && props.rank > props.capacity) {
    positive = false
    message = (
      <p>You have been crowded out of this role, and will not be considered.</p>
    )
  }
  return (
    <Message positive={positive} negative={!positive}>
      <Message.Header>
        <RankAndCapacity rank={props.rank} capacity={props.capacity} />
      </Message.Header>
      {message}
    </Message>
  )
}

function ApplicationStatusComplete(props: ApplicationStatusProps): any {
  return (
    <Message negative>
      <Message.Header>
        <Icon name='thumbs down outline' />
        Application unsuccessful
      </Message.Header>
      <p>You were not hired for this role.</p>
    </Message>
  )
}

function ApplicationStatusHired(props: ApplicationStatusProps) {
  return (
    <Message positive>
      <Message.Header>
        <Icon name='thumbs up outline' />
        Application successful!
      </Message.Header>
      <p>You were hired for this role.</p>
    </Message>
  )
}

export function ApplicationStatus(props: ApplicationStatusProps) {
  if (typeof props.hired !== "undefined" && props.hired) {
    return ApplicationStatusHired(props)
  } else if (typeof props.cancelledReason !== "undefined") {
    return ApplicationCancelledStatus(props)
  }

  return (applicationStatusRenderers.get(props.openingStatus) as statusRenderer)(props)
}

enum ApplicationState {
  Positive = 0,
  Negative,
  Cancelled,
}

const applicationClass = new Map<ApplicationState, string>([
  [ApplicationState.Positive, 'positive'],
  [ApplicationState.Negative, 'negative'],
  [ApplicationState.Cancelled, 'cancelled'],
])

function applicationState(props: OpeningApplication): ApplicationState {
  if (typeof props.cancelledReason !== 'undefined') {
    return ApplicationState.Cancelled
  } else if (props.capacity > 0 && props.rank > props.capacity) {
    return ApplicationState.Negative
  }
  return ApplicationState.Positive
}

export type OpeningApplication = {
  rank: number
  capacity: number
  cancelledReason?: CancelledReason
  hired?: boolean
  stage: OpeningStageClassification
  creator: GroupMember
  opening: Opening
  meta: OpeningMetadata
  applicationStake: Balance
  roleStake: Balance
  review_end_time?: Date
  review_end_block?: number
}

export type CancelCallback = {
  cancelCallback: (opening: Opening) => void
}

export type ApplicationProps = OpeningApplication & CancelCallback

export function Application(props: ApplicationProps) {
  let countdown = null
  if (props.stage.state == OpeningState.InReview) {
    countdown = <OpeningBodyReviewInProgress {...props.stage} />
  }

  const application = props.opening.human_readable_text as GenericJoyStreamRoleSchema
  const appState = applicationState(props)

  let CTA = null
  if (appState == ApplicationState.Positive) {
    CTA = <Button fluid
      icon
      labelPosition='left'
      negative
      className='cta'
      onClick={() => { props.cancelCallback(props.opening) }}
    >
      <Icon name='warning sign' />
      Cancel and withdraw stake
     </Button>
  }

  return (
    <Segment className={'application status-' + applicationClass.get(appState)}>
      <Label attached='top'>
        {application.job.title}
        <Label.Detail className="right">
          {openingIcon(props.stage.state)}
          {openingDescription(props.stage.state)}
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

          <h4>Group lead</h4>
          <GroupMemberView {...props.creator} inset={true} />
          {CTA}
        </Grid.Column>
      </Grid>
    </Segment>
  )
}

export type ApplicationsProps = CancelCallback & {
  applications: OpeningApplication[]
}

export const Applications = Loadable<ApplicationsProps>(
  ['applications'],
  props => (
    <Container className="current-applications">
      <h2>Applications</h2>
      {props.applications.map((app, key) => (
        <Application key={key} cancelCallback={props.cancelCallback} {...app} />
      ))}
    </Container>
  )
)
