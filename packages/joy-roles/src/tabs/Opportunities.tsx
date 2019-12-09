import React from 'react'
import Moment from 'react-moment';
import NumberFormat from 'react-number-format';
import marked from 'marked';
import CopyToClipboard from 'react-copy-to-clipboard';

import { Link } from 'react-router-dom';
import { Button, Card, Container, Grid, Icon, Label, List, Message, Statistic, SemanticICONS } from 'semantic-ui-react'

import { formatBalance } from '@polkadot/util';
import { Balance } from '@polkadot/types/interfaces';

import { Countdown, GroupMember, GroupMemberView } from '../elements'
import { GenericJoyStreamRoleSchema } from '@joystream/types/schemas/role.schema'
import { Opening } from "@joystream/types/hiring"

import { OpeningStageClassification, OpeningState } from "../classifiers"

import { Loadable } from '@polkadot/joy-utils/index'

export type headerMarkup = {
  class: string
  description: string
  icon: SemanticICONS
  iconSpin?: boolean
}

export const stateMarkup = new Map<OpeningState, headerMarkup>([
  [OpeningState.WaitingToBegin, {
    class: "waiting-to-begin",
    description: "Waiting to begin",
    icon: "spinner",
    iconSpin: true,
  }],
  [OpeningState.AcceptingApplications, {
    class: "active",
    description: "Accepting applications",
    icon: "heart",
  }],
  [OpeningState.InReview, {
    class: "in-review",
    description: "Applications in review",
    icon: "hourglass half",
  }],
  [OpeningState.Complete, {
    class: "complete",
    description: "Hiring complete",
    icon: "thumbs up",
  }],
  [OpeningState.Cancelled, {
    class: "cancelled",
    description: "Cancelled",
    icon: "ban",
  }],
])

function openingStateMarkup<T>(state: OpeningState, key: string): T {
  const markup = stateMarkup.get(state)

  if (typeof markup === "undefined") {
    return null as unknown as T
  }

  return (markup as any)[key]
}

export function openingClass(state: OpeningState): string {
  return "status-" + openingStateMarkup<string>(state, "class")
}

export function openingDescription(state: OpeningState): string {
  return openingStateMarkup<string>(state, "description")
}

export function openingIcon(state: OpeningState) {
  const icon = openingStateMarkup<SemanticICONS>(state, "icon")
  const spin = openingStateMarkup<boolean>(state, "iconSpin")

  return <Icon name={icon} loading={spin} />
}

type OpeningStage = {
  stage: OpeningStageClassification
}

export function OpeningHeader(props: OpeningStage) {
  return (
    <Grid columns="equal">
      <Grid.Column className="status">
        <Label ribbon size="large">
          {openingIcon(props.stage.state)}
          {openingDescription(props.stage.state)}
        </Label>
      </Grid.Column>
      <Grid.Column className="meta" textAlign="right">
        <Label>
          <Icon name="history" /> Created&nbsp;
                        <Moment unix format="DD/MM/YYYY, HH:MM:SS">{props.stage.created_time.getTime() / 1000}</Moment>
          <Label.Detail>
            <Link to={`#/explorer/query/${props.stage.starting_block_hash}`}>
              <Icon name="cube" />
              <NumberFormat value={props.stage.starting_block}
                displayType="text"
                thousandSeparator={true}
              />
            </Link>
          </Label.Detail>
        </Label>
        <a>
          <CopyToClipboard text={props.stage.uri}>
            <Label>
              <Icon name="copy" /> Copy link
                        </Label>
          </CopyToClipboard>
        </a>
      </Grid.Column>
    </Grid>
  )
}

type DefactoMinimumStake = {
  defactoMinimumStake: Balance
}

type OpeningBodyCTAProps = OpeningStakeAndApplicationStatus & OpeningStage & OpeningBodyProps

function OpeningBodyCTAView(props: OpeningBodyCTAProps) {
  if (props.stage.state != OpeningState.AcceptingApplications || applicationImpossible(props.applications)) {
    return null
  }

  let message = (
    <Message positive>
      <Icon name="check circle" /> No stake required
        </Message>
  )

  if (hasAnyStake(props)) {
    const balance = !props.defactoMinimumStake.isZero() ? props.defactoMinimumStake : props.requiredApplicationStake.hard.add(props.requiredRoleStake.hard)
    const plural = (props.requiredApplicationStake.anyRequirement() && props.requiredRoleStake.anyRequirement()) ? "s totalling" : " of"
    message = (
      <Message warning>
        <Icon name="warning sign" /> Stake{plural} at least <strong>{formatBalance(balance)}</strong> required!
            </Message>
    )
  }

  return (
    <Container>
      <Link to={props.stage.uri}>
        <Button icon fluid positive size="huge">
          APPLY NOW
          <Icon name="angle right" />
        </Button>
      </Link>
      {message}
    </Container>
  )
}

export enum StakeType {
  Fixed = 0,
  AtLeast,
}

export interface IStakeRequirement {
  anyRequirement(): boolean
  qualifier(): string | null
  value: Balance
  fixed(): boolean
  atLeast(): boolean
  describe(): any
}

abstract class StakeRequirement {
  hard: Balance
  type: StakeType

  constructor(hard: Balance, stakeType: StakeType = StakeType.Fixed) {
    this.hard = hard
    this.type = stakeType
  }

  anyRequirement(): boolean {
    return !this.hard.isZero()
  }

  qualifier(): string | null {
    if (this.type == StakeType.AtLeast) {
      return "at least"
    }
    return null
  }

  get value(): Balance {
    return this.hard
  }

  fixed(): boolean {
    return this.type === StakeType.Fixed
  }

  atLeast(): boolean {
    return this.type === StakeType.AtLeast
  }
}

export class ApplicationStakeRequirement extends StakeRequirement implements IStakeRequirement {
  describe(): any {
    if (!this.anyRequirement()) {
      return null
    }

    return (
      <p>
        You must stake {this.qualifier()} <strong>{formatBalance(this.hard)}</strong> to apply for this role. This stake will be returned to you when the hiring process is complete, whether or not you are hired, and will also be used to rank applications.
            </p>
    )
  }
}

export class RoleStakeRequirement extends StakeRequirement implements IStakeRequirement {
  describe(): any {
    if (!this.anyRequirement()) {
      return null
    }

    return (
      <p>
        You must stake {this.qualifier()} <strong>{formatBalance(this.hard)}</strong> to be eligible for this role. You may lose this stake if you're hired and then dismised from this role. This stake will be returned if your application is unsuccessful, and will also be used to rank applications.
            </p>
    )
  }
}

export type StakeRequirementProps = DefactoMinimumStake & {
  requiredApplicationStake: ApplicationStakeRequirement
  requiredRoleStake: RoleStakeRequirement
  maxNumberOfApplications: number
}

function hasAnyStake(props: StakeRequirementProps): boolean {
  return props.requiredApplicationStake.anyRequirement() || props.requiredRoleStake.anyRequirement()
}

class messageState {
  positive: boolean = true
  warning: boolean = false
  negative: boolean = false

  setPositive(): void {
    this.positive = true
    this.warning = false
    this.negative = false
  }

  setWarning(): void {
    this.positive = false
    this.warning = true
    this.negative = false
  }

  setNegative(): void {
    this.positive = false
    this.warning = false
    this.negative = true
  }
}

export function OpeningBodyStakeRequirement(props: StakeRequirementProps) {
  if (!hasAnyStake(props)) {
    return null
  }

  const plural = (props.requiredApplicationStake.anyRequirement() && props.requiredRoleStake.anyRequirement()) ? "s" : null
  let title = <Message.Header color="orange" as='h5'><Icon name="shield" /> Stake{plural} required!</Message.Header>
  let explanation = null

  if (!props.defactoMinimumStake.isZero()) {
    title = <Message.Header color="orange" as='h5'><Icon name="shield" /> Increased stake{plural} required!</Message.Header>
    explanation = (
      <p>
        However, in order to be in the top {props.maxNumberOfApplications} candidates, you wil need to stake at least <strong>{formatBalance(props.defactoMinimumStake)} in total</strong>.
            </p>
    )
  }

  return (
    <Message className="stake-requirements" warning>
      {title}
      {props.requiredApplicationStake.describe()}
      {props.requiredRoleStake.describe()}
      {explanation}
    </Message>
  )
}

export type ApplicationCountProps = {
  numberOfApplications: number
  maxNumberOfApplications: number
  applied?: boolean
}

export type OpeningStakeAndApplicationStatus = StakeRequirementProps & ApplicationCountProps

function applicationImpossible(props: OpeningStakeAndApplicationStatus): boolean {
  return props.maxNumberOfApplications > 0 &&
    (props.numberOfApplications >= props.maxNumberOfApplications) &&
    !hasAnyStake(props)
}

function applicationPossibleWithIncresedStake(props: OpeningStakeAndApplicationStatus): boolean {
  return props.maxNumberOfApplications > 0 &&
    (props.numberOfApplications >= props.maxNumberOfApplications) &&
    hasAnyStake(props)
}

export function ApplicationCount(props: ApplicationCountProps) {
  let max_applications = null
  if (props.maxNumberOfApplications > 0) {
    max_applications = (
      <span>
        /
                <NumberFormat value={props.maxNumberOfApplications}
          displayType="text"
          thousandSeparator={true}
        />
      </span>
    )
  }

  return (
    <span>
      <NumberFormat value={props.numberOfApplications + (props.applied ? 1 : 0)}
        displayType="text"
        thousandSeparator={true}
      />
      {max_applications}
    </span>
  )
}

export function OpeningBodyApplicationsStatus(props: OpeningStakeAndApplicationStatus) {
  const impossible = applicationImpossible(props)
  const msg = new messageState()
  if (impossible) {
    msg.setNegative()
  } else if (applicationPossibleWithIncresedStake(props)) {
    msg.setWarning()
  }

  let order = null
  if (hasAnyStake(props)) {
    order = ", ordered by total stake,"
  }

  let max_applications = null
  let message = <p>All applications{order} will be considered during the review period.</p>

  if (props.maxNumberOfApplications > 0) {
    max_applications = (
      <span>
        /
                <NumberFormat value={props.maxNumberOfApplications}
          displayType="text"
          thousandSeparator={true}
        />
      </span>
    )

    let disclaimer = null
    if (impossible) {
      disclaimer = "No futher applications will be considered."
    }

    message = (
      <p>Only the top {props.maxNumberOfApplications} applications{order} will be considered for this role. {disclaimer}</p>
    )
  }

  return (
    <Message positive={msg.positive} warning={msg.warning} negative={msg.negative}>
      <Statistic size="small">
        <Statistic.Value>
          <NumberFormat value={props.numberOfApplications + (props.applied ? 1 : 0)}
            displayType="text"
            thousandSeparator={true}
          />
          {max_applications}
        </Statistic.Value>
        <Statistic.Label>Applications</Statistic.Label>
      </Statistic>
      {message}
    </Message>
  )
}

export function OpeningBodyReviewInProgress(props: OpeningStageClassification) {
  let countdown = null
  if (typeof props.review_end_time !== "undefined") {
    countdown = <Countdown end={props.review_end_time} />
  }

  return (
    <Message info className="countdown">
      <h4>Review process has begun</h4>
      {countdown}

      <p>
        <span>Candidates will be selected by block&nbsp;
			<NumberFormat value={props.review_end_block}
            displayType="text"
            thousandSeparator={true}
          />
          &nbsp;(expected on&nbsp;
                </span>
        <strong>
          <Moment format="MMM DD, YYYY  HH:mm:ss" date={props.review_end_time} interval={0} />
        </strong>
        )
        <span> at the latest.</span>
      </p>
    </Message>
  )
}

type BlockTimeProps = {
  block_time_in_seconds: number
}

function timeInHumanFormat(block_time_in_seconds: number, blocks: number) {
  const d1 = new Date()
  const d2 = new Date(d1.getTime())
  d2.setSeconds(d2.getSeconds() + (block_time_in_seconds * blocks))
  return <Moment duration={d1} date={d2} interval={0} />
}


export type OpeningBodyProps = DefactoMinimumStake & StakeRequirementProps & BlockTimeProps & {
  opening: Opening
  text: GenericJoyStreamRoleSchema
  creator: GroupMember
  stage: OpeningStageClassification
  applications: OpeningStakeAndApplicationStatus
}

export function OpeningBody(props: OpeningBodyProps) {
  const jobDesc = marked(props.text.job.description || '')
  const blockNumber = <NumberFormat value={props.opening.max_review_period_length.toNumber()}
    displayType="text"
    thousandSeparator={true} />

  let stakeRequirements = null
  switch (props.stage.state) {
    case OpeningState.WaitingToBegin:
    case OpeningState.AcceptingApplications:
      stakeRequirements = <OpeningBodyStakeRequirement {...props.applications} defactoMinimumStake={props.defactoMinimumStake} />
      break

    case OpeningState.InReview:
      stakeRequirements = <OpeningBodyReviewInProgress {...props.stage} />
      break
  }

  return (
    <Grid columns="equal">
      <Grid.Column width={10} className="summary">
        <Card.Header>
          <OpeningReward text={props.text.reward} />
        </Card.Header>
        <h4 className="headline">{props.text.headline}</h4>
        <h5>Role description</h5>
        <div dangerouslySetInnerHTML={{ __html: jobDesc }} />
        <h5>Hiring process details</h5>
        <List>
          <List.Item>
            <List.Icon name="clock" />
            <List.Content>
              The maximum review period for this opening is <strong>{blockNumber} blocks</strong> (approximately <strong>{timeInHumanFormat(props.block_time_in_seconds, props.opening.max_review_period_length.toNumber())}</strong>).
                        </List.Content>
          </List.Item>
          {props.text.process && props.text.process.details.map((detail, key) => (
            <List.Item key={key}>
              <List.Icon name="info circle" />
              <List.Content>{detail}</List.Content>
            </List.Item>
          ))}
        </List>
      </Grid.Column>
      <Grid.Column width={6} className="details">
        <OpeningBodyApplicationsStatus {...props.applications} />
        {stakeRequirements}
        <h5>Group lead</h5>
        <GroupMemberView {...props.creator} inset={true} />
        <OpeningBodyCTAView {...props} {...props.applications} />
      </Grid.Column>
    </Grid>
  )
}

type OpeningRewardProps = {
  text: string
}

function OpeningReward(props: OpeningRewardProps) {
  return (
    <Statistic size="small">
      <Statistic.Label>Reward</Statistic.Label>
      <Statistic.Value>{props.text}</Statistic.Value>
    </Statistic>
  )
}

export type WorkingGroupOpening =  OpeningStage & DefactoMinimumStake & {
  opening: Opening
  creator: GroupMember
  applications: OpeningStakeAndApplicationStatus
}

type OpeningViewProps = WorkingGroupOpening & BlockTimeProps

export function OpeningView(props: OpeningViewProps) {
  const hrt = props.opening.human_readable_text

  if (typeof hrt === "undefined" || typeof hrt === "string") {
    return null
  }

  const text = hrt as GenericJoyStreamRoleSchema

  return (
    <Container className={"opening " + openingClass(props.stage.state)}>
      <h2>{text.job.title}</h2>
      <Card fluid className="container">
        <Card.Content className="header">
          <OpeningHeader stage={props.stage} />
        </Card.Content>
        <Card.Content className="main">
          <OpeningBody 
            {...props.applications}
            text={text}
            opening={props.opening}
            creator={props.creator}
            stage={props.stage}
            applications={props.applications}
            defactoMinimumStake={props.defactoMinimumStake}
            block_time_in_seconds={props.block_time_in_seconds}
          />
        </Card.Content>
      </Card>
    </Container>
  )
}

export type OpeningsViewProps = BlockTimeProps & {
  openings: Array<WorkingGroupOpening>
}

export const OpeningsView = Loadable<OpeningsViewProps>(
  ['openings'],
  props => {
    return (
      <Container>
        {props.openings.map((opening, key) => (
          <OpeningView key={key} {...opening} block_time_in_seconds={props.block_time_in_seconds} />
        ))}
      </Container>
    )
  }
)
