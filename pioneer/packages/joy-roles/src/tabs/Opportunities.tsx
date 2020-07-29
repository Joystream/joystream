import React from 'react';
import Moment from 'react-moment';
import NumberFormat from 'react-number-format';
import marked from 'marked';
import CopyToClipboard from 'react-copy-to-clipboard';

import { Link, useHistory, useLocation } from 'react-router-dom';
import {
  Button,
  Card,
  Container,
  Grid,
  Icon,
  Label,
  List,
  Message,
  Statistic,
  Dropdown,
  DropdownProps
} from 'semantic-ui-react';

import { formatBalance } from '@polkadot/util';
import { Balance } from '@polkadot/types/interfaces';

import { useMyAccount } from '@polkadot/joy-utils/MyAccountContext';

import { Countdown } from '../elements';
import { ApplicationStakeRequirement, RoleStakeRequirement } from '../StakeRequirement';
import { GenericJoyStreamRoleSchema } from '@joystream/types/hiring/schemas/role.schema.typings';
import { Opening } from '@joystream/types/hiring';
import { MemberId } from '@joystream/types/members';

import { OpeningStageClassification, OpeningState } from '../classifiers';
import { OpeningMetadataProps } from '../OpeningMetadata';
import {
  openingIcon,
  openingClass,
  openingDescription
} from '../openingStateMarkup';

import { Loadable } from '@polkadot/joy-utils/index';
import styled from 'styled-components';
import _ from 'lodash';
import { WorkingGroups, AvailableGroups, workerRoleNameByGroup } from '../working_groups';

type OpeningStage = OpeningMetadataProps & {
  stage: OpeningStageClassification;
}

function classificationDescription (state: OpeningState): string {
  switch (state) {
    case OpeningState.AcceptingApplications:
      return 'Started';

    case OpeningState.InReview:
      return 'Review started';

    case OpeningState.Complete:
    case OpeningState.Cancelled:
      return 'Ended';
  }

  return 'Created';
}

export function OpeningHeader (props: OpeningStage) {
  let time = null;
  if (props.stage.starting_time.getTime() > 0) {
    time = <Moment unix format="DD/MM/YYYY, hh:mm A">{props.stage.starting_time.getTime() / 1000}</Moment>;
  }
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
          <Icon name="history" /> {classificationDescription(props.stage.state)}&nbsp;
          {time}
          <Label.Detail>
            <Link to={`/explorer/query/${props.stage.starting_block_hash}`}>
              <Icon name="cube" />
              <NumberFormat value={props.stage.starting_block}
                displayType="text"
                thousandSeparator={true}
              />
            </Link>
          </Label.Detail>
          <Label.Detail>
            <Icon name="hashtag" /> {props.meta.id}
          </Label.Detail>
        </Label>
        <a>
          <CopyToClipboard text={window.location.origin + '/#/working-groups/opportunities/' + props.meta.group + '/' + props.meta.id}>
            <Label>
              <Icon name="copy" /> Copy link
            </Label>
          </CopyToClipboard>
        </a>
      </Grid.Column>
    </Grid>
  );
}

type DefactoMinimumStake = {
  defactoMinimumStake: Balance;
}

type MemberIdProps = {
  member_id?: MemberId;
}

export type StakeRequirementProps = DefactoMinimumStake & {
  requiredApplicationStake: ApplicationStakeRequirement;
  requiredRoleStake: RoleStakeRequirement;
  maxNumberOfApplications: number;
}

function hasAnyStake (props: StakeRequirementProps): boolean {
  return props.requiredApplicationStake.anyRequirement() || props.requiredRoleStake.anyRequirement();
}

class MessageState {
  positive = true
  warning = false
  negative = false

  setPositive (): void {
    this.positive = true;
    this.warning = false;
    this.negative = false;
  }

  setWarning (): void {
    this.positive = false;
    this.warning = true;
    this.negative = false;
  }

  setNegative (): void {
    this.positive = false;
    this.warning = false;
    this.negative = true;
  }
}

export function OpeningBodyStakeRequirement (props: StakeRequirementProps) {
  if (!hasAnyStake(props)) {
    return null;
  }

  const plural = (props.requiredApplicationStake.anyRequirement() && props.requiredRoleStake.anyRequirement()) ? 's' : null;
  let title = <Message.Header color="orange" as='h5'><Icon name="shield" /> Stake{plural} required!</Message.Header>;
  let explanation = null;

  if (!props.defactoMinimumStake.isZero()) {
    title = <Message.Header color="orange" as='h5'><Icon name="shield" /> Increased stake{plural} required!</Message.Header>;
    explanation = (
      <p>
        However, in order to be in the top {props.maxNumberOfApplications} candidates, you wil need to stake at least <strong>{formatBalance(props.defactoMinimumStake)} in total</strong>.
      </p>
    );
  }

  return (
    <Message className="stake-requirements" warning>
      {title}
      {props.requiredApplicationStake.describe()}
      {props.requiredRoleStake.describe()}
      {explanation}
    </Message>
  );
}

export type ApplicationCountProps = {
  numberOfApplications: number;
  maxNumberOfApplications: number;
  applied?: boolean;
}

export type OpeningStakeAndApplicationStatus = StakeRequirementProps & ApplicationCountProps

function applicationImpossible (props: OpeningStakeAndApplicationStatus): boolean {
  return props.maxNumberOfApplications > 0 &&
    (props.numberOfApplications >= props.maxNumberOfApplications) &&
    !hasAnyStake(props);
}

function applicationPossibleWithIncresedStake (props: OpeningStakeAndApplicationStatus): boolean {
  return props.maxNumberOfApplications > 0 &&
    (props.numberOfApplications >= props.maxNumberOfApplications) &&
    hasAnyStake(props);
}

export function ApplicationCount (props: ApplicationCountProps) {
  let max_applications = null;
  if (props.maxNumberOfApplications > 0) {
    max_applications = (
      <span>
        /
        <NumberFormat value={props.maxNumberOfApplications}
          displayType="text"
          thousandSeparator={true}
        />
      </span>
    );
  }

  return (
    <span>
      <NumberFormat value={props.numberOfApplications + (props.applied ? 1 : 0)}
        displayType="text"
        thousandSeparator={true}
      />
      {max_applications}
    </span>
  );
}

type OpeningBodyCTAProps = OpeningStakeAndApplicationStatus & OpeningStage & OpeningBodyProps & MemberIdProps

function OpeningBodyCTAView (props: OpeningBodyCTAProps) {
  if (props.stage.state !== OpeningState.AcceptingApplications || applicationImpossible(props.applications)) {
    return null;
  }

  let message = (
    <Message positive>
      <Icon name="check circle" /> No stake required
    </Message>
  );

  if (hasAnyStake(props)) {
    const balance = !props.defactoMinimumStake.isZero() ? props.defactoMinimumStake : props.requiredApplicationStake.hard.add(props.requiredRoleStake.hard);
    const plural = (props.requiredApplicationStake.anyRequirement() && props.requiredRoleStake.anyRequirement()) ? 's totalling' : ' of';
    message = (
      <Message warning icon>
        <Icon name="warning sign" />
        <Message.Content>
          Stake{plural} at least <strong>{formatBalance(balance)}</strong> required!
        </Message.Content>
      </Message>
    );
  }

  let applyButton = (
    <Link to={'/working-groups/opportunities/' + props.meta.group + '/' + props.meta.id + '/apply'}>
      <Button icon fluid positive size="huge">
        APPLY NOW
        <Icon name="angle right" />
      </Button>
    </Link>
  );

  const accountCtx = useMyAccount();
  if (!accountCtx.state.address) {
    applyButton = (
      <Message error icon>
        <Icon name="info circle" />
        <Message.Content>
          You will need an account to apply for this role. You can generate one in the <Link to="/accounts">Accounts</Link> section.
        </Message.Content>
      </Message>
    );
    message = <p></p>;
  } else if (!props.member_id) {
    applyButton = (
      <Message error icon>
        <Icon name="info circle" />
        <Message.Content>
          You will need a membership to apply for this role. You can sign up in the <Link to="/members">Membership</Link> section.
        </Message.Content>
      </Message>
    );
    message = <p></p>;
  }

  return (
    <Container>
      {applyButton}
      {message}
    </Container>
  );
}

export function OpeningBodyApplicationsStatus (props: OpeningStakeAndApplicationStatus) {
  const impossible = applicationImpossible(props);
  const msg = new MessageState();
  if (impossible) {
    msg.setNegative();
  } else if (applicationPossibleWithIncresedStake(props)) {
    msg.setWarning();
  }

  let order = null;
  if (hasAnyStake(props)) {
    order = ', ordered by total stake,';
  }

  let max_applications = null;
  let message = <p>All applications{order} will be considered during the review period.</p>;

  if (props.maxNumberOfApplications > 0) {
    max_applications = (
      <span>
        /
        <NumberFormat value={props.maxNumberOfApplications}
          displayType="text"
          thousandSeparator={true}
        />
      </span>
    );

    let disclaimer = null;
    if (impossible) {
      disclaimer = 'No futher applications will be considered.';
    }

    message = (
      <p>Only the top {props.maxNumberOfApplications} applications{order} will be considered for this role. {disclaimer}</p>
    );
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
  );
}

export function OpeningBodyReviewInProgress (props: OpeningStageClassification) {
  let countdown = null;
  let expected = null;
  if (props.review_end_time && props.starting_time.getTime() > 0) {
    countdown = <Countdown end={props.review_end_time} />;
    expected = (
      <span>
        &nbsp;(expected on&nbsp;
        <strong>
          <Moment format="MMM DD, YYYY  HH:mm:ss" date={props.review_end_time} interval={0} />
        </strong>
        )
      </span>
    );
  }

  return (
    <Message info className="countdown">
      <h4>Review process has begun</h4>
      {countdown}

      <p>
        <span>Candidates will be selected by block&nbsp;
          <strong>
            <NumberFormat value={props.review_end_block}
              displayType="text"
              thousandSeparator={true}
            />
          </strong>
        </span>
        {expected}
        <span> at the latest.</span>
      </p>
    </Message>
  );
}

type BlockTimeProps = {
  block_time_in_seconds: number;
}

function timeInHumanFormat (block_time_in_seconds: number, blocks: number) {
  const d1 = new Date();
  const d2 = new Date(d1.getTime());
  d2.setSeconds(d2.getSeconds() + (block_time_in_seconds * blocks));
  return <Moment duration={d1} date={d2} interval={0} />;
}

export type OpeningBodyProps = DefactoMinimumStake & StakeRequirementProps & BlockTimeProps & OpeningMetadataProps & MemberIdProps & {
  opening: Opening;
  text: GenericJoyStreamRoleSchema;
  stage: OpeningStageClassification;
  applications: OpeningStakeAndApplicationStatus;
}

export function OpeningBody (props: OpeningBodyProps) {
  const jobDesc = marked(props.text.job.description || '');
  const blockNumber = <NumberFormat value={props.opening.max_review_period_length.toNumber()}
    displayType="text"
    thousandSeparator={true} />;

  let stakeRequirements = null;
  switch (props.stage.state) {
    case OpeningState.WaitingToBegin:
    case OpeningState.AcceptingApplications:
      stakeRequirements = <OpeningBodyStakeRequirement {...props.applications} defactoMinimumStake={props.defactoMinimumStake} />;
      break;

    case OpeningState.InReview:
      stakeRequirements = <OpeningBodyReviewInProgress {...props.stage} />;
      break;
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
        <OpeningBodyCTAView {...props} {...props.applications} />
      </Grid.Column>
    </Grid>
  );
}

type OpeningRewardProps = {
  text: string;
}

function OpeningReward (props: OpeningRewardProps) {
  return (
    <Statistic size="small">
      <Statistic.Label>Reward</Statistic.Label>
      <Statistic.Value>{props.text}</Statistic.Value>
    </Statistic>
  );
}

export type WorkingGroupOpening = OpeningStage & DefactoMinimumStake & OpeningMetadataProps & {
  opening: Opening;
  applications: OpeningStakeAndApplicationStatus;
}

const OpeningTitle = styled.h2`
  display: flex;
  align-items: flex-end;
`;
const OpeningLabel = styled(Label)`
  margin-left: auto !important;
`;

type OpeningViewProps = WorkingGroupOpening & BlockTimeProps & MemberIdProps

export const OpeningView = Loadable<OpeningViewProps>(
  ['opening', 'block_time_in_seconds'],
  props => {
    const text = props.opening.parse_human_readable_text_with_fallback();
    const isLeadOpening = props.meta.type?.isOfType('Leader');

    return (
      <Container className={'opening ' + openingClass(props.stage.state)}>
        <OpeningTitle>
          {text.job.title}
          <OpeningLabel>
            { _.startCase(props.meta.group) }{ isLeadOpening ? ' Lead' : '' }
          </OpeningLabel>
        </OpeningTitle>
        <Card fluid className="container">
          <Card.Content className="header">
            <OpeningHeader stage={props.stage} meta={props.meta} />
          </Card.Content>
          <Card.Content className="main">
            <OpeningBody
              {...props.applications}
              text={text}
              meta={props.meta}
              opening={props.opening}
              stage={props.stage}
              applications={props.applications}
              defactoMinimumStake={props.defactoMinimumStake}
              block_time_in_seconds={props.block_time_in_seconds}
              member_id={props.member_id}
            />
          </Card.Content>
        </Card>
      </Container>
    );
  }
);

const FilterOpportunities = styled.div`
  display: flex;
  width: 100%;
  margin-bottom: 1rem;
`;
const FilterOpportunitiesDropdown = styled(Dropdown)`
  margin-left: auto !important;
  width: 250px !important;
`;

export type OpeningsViewProps = MemberIdProps & {
  openings?: Array<WorkingGroupOpening>;
  block_time_in_seconds?: number;
  group?: WorkingGroups;
  lead?: boolean;
}

export const OpeningsView = Loadable<OpeningsViewProps>(
  ['openings', 'block_time_in_seconds'],
  props => {
    const history = useHistory();
    const location = useLocation();
    const basePath = '/working-groups/opportunities';
    const { group = null, lead = false } = props;
    const onFilterChange: DropdownProps['onChange'] = (e, data) => {
      const newPath = data.value || basePath;
      if (newPath !== location.pathname) { history.push(newPath as string); }
    };
    const groupOption = (group: WorkingGroups | null, lead = false) => ({
      value: `${basePath}${group ? `/${group}` : ''}${lead ? '/lead' : ''}`,
      text: _.startCase(`${group || 'All opportunities'}`) + (lead ? ' (Lead)' : '')
    });
    // Can assert "props.openings!" because we're using "Loadable" which prevents them from beeing undefined
    const filteredOpenings = props.openings!.filter(o =>
      (!group || o.meta.group === group) &&
      (!group || !o.meta.type || (lead === o.meta.type.isOfType('Leader')))
    );

    return (
      <Container>
        <FilterOpportunities>
          <FilterOpportunitiesDropdown
            placeholder="All opportunities"
            options={
              [groupOption(null, false)]
                .concat(AvailableGroups.map(g => groupOption(g)))
                // Currently we filter-out content curators, because they don't use the new working-group module yet
                .concat(AvailableGroups.filter(g => g !== WorkingGroups.ContentCurators).map(g => groupOption(g, true)))
            }
            value={groupOption(group, lead).value}
            onChange={onFilterChange}
            selection
          />
        </FilterOpportunities>
        { (
          filteredOpenings.length
            ? filteredOpenings.map((opening, key) => (
              <OpeningView
                key={key}
                {...opening}
                block_time_in_seconds={props.block_time_in_seconds as number}
                member_id={props.member_id} />
            ))
            : (
              <h2>
                No openings{group ? ` for ${workerRoleNameByGroup[group]}${lead ? ' Lead' : ''} role ` : ' '}
                are currently available!
              </h2>
            )
        ) }
      </Container>
    );
  }
);

export const OpeningError = () => {
  return (
    <Container>
      <Message error>
        Uh oh! Something went wrong
      </Message>
    </Container>
  );
};
