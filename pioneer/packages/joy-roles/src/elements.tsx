import React, { useEffect, useState } from 'react';
import moment from 'moment';
import { Card, Icon, Image, Label, Statistic, Button } from 'semantic-ui-react';
import { Link } from 'react-router-dom';

import { Balance } from '@polkadot/types/interfaces';
import { formatBalance } from '@polkadot/util';
import Identicon from '@polkadot/react-identicon';
import { IProfile, MemberId } from '@joystream/types/members';
import { GenericAccountId } from '@polkadot/types';
import { LeadRoleState } from '@joystream/types/content-working-group';
import { WorkerId } from '@joystream/types/working-group';
import { WorkingGroups } from './working_groups';
import { RewardRelationship } from '@joystream/types/recurring-rewards';
import { formatReward } from '@polkadot/joy-utils/functions/format';
import styled from 'styled-components';

type BalanceProps = {
  balance?: Balance;
}

export function BalanceView (props: BalanceProps) {
  return (
    <div className="balance">
      <span>Balance:</span> {formatBalance(props.balance)}
    </div>
  );
}

type ProfileProps = {
  profile: IProfile;
}

export function HandleView (props: ProfileProps) {
  if (typeof props.profile === 'undefined') {
    return null;
  }

  return (
    <Link to={`/members/${props.profile.handle.toString()}`}>{props.profile.handle.toString()}</Link>
  );
}

export type GroupMember = {
  memberId: MemberId;
  group: WorkingGroups;
  workerId: number;
  roleAccount: GenericAccountId;
  profile: IProfile;
  title: string;
  stake?: Balance;
  earned?: Balance;
  missed?: Balance;
  rewardRelationship?: RewardRelationship;
}

export type GroupLead = {
  memberId: MemberId;
  workerId?: WorkerId; // In case of "working-group" module
  roleAccount: GenericAccountId;
  profile: IProfile;
  title: string;
  stage?: LeadRoleState;
}

type inset = {
  inset?: boolean;
}

export function GroupLeadView (props: GroupLead & inset) {
  let fluid = false;
  if (typeof props.inset !== 'undefined') {
    fluid = props.inset;
  }

  let avatar = <Identicon value={props.roleAccount.toString()} size={50} />;
  if (typeof props.profile.avatar_uri !== 'undefined' && props.profile.avatar_uri.toString() !== '') {
    avatar = <Image src={props.profile.avatar_uri.toString()} circular className='avatar' />;
  }

  return (
    <Card color='grey' className="staked-card" fluid={fluid}>
      <Card.Content>
        <Image floated='right'>
          {avatar}
        </Image>
        <Card.Header><HandleView profile={props.profile} /></Card.Header>
        <Card.Meta>{props.title}</Card.Meta>
        <Card.Meta>
          { props.workerId && (
            <Label>{ 'Worker ID: ' + props.workerId.toString() }</Label>
          ) }
        </Card.Meta>
        <Card.Description>
          <Label color='teal' ribbon={fluid}>
            <Icon name="shield" />
            { props.title }
            <Label.Detail>{/* ... */}</Label.Detail>
          </Label>
        </Card.Description>
      </Card.Content>
      {/* <Card.Content extra>
        <Label>Something about <Label.Detail> the lead </Label.Detail></Label>
      </Card.Content> */}
    </Card>
  );
}

const StakeAndReward = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  grid-row-gap: 0.25em;
  margin-bottom: 1em;
`;

export function GroupMemberView (props: GroupMember) {
  const [showDetails, setShowDetails] = useState(false);

  let avatar = <Identicon value={props.roleAccount.toString()} size={50} />;
  if (typeof props.profile.avatar_uri !== 'undefined' && props.profile.avatar_uri.toString() !== '') {
    avatar = <Image src={props.profile.avatar_uri.toString()} circular className='avatar' />;
  }

  const details: JSX.Element[] = [];
  if (typeof props.stake !== 'undefined' && props.stake.toNumber() !== 0) {
    details.push(
      <Label color='green'>
        <Icon name="shield" />
        Staked
        <Label.Detail>{formatBalance(props.stake)}</Label.Detail>
      </Label>
    );
  }
  if (props.rewardRelationship) {
    details.push(
      <Label>Reward <Label.Detail>{formatReward(props.rewardRelationship)}</Label.Detail></Label>
    );
  }
  if (props.earned && props.earned.toNumber() > 0) {
    details.push(
      <Label>Earned <Label.Detail>{formatBalance(props.earned)}</Label.Detail></Label>
    );
  }
  if (props.missed && props.missed.toNumber() > 0) {
    details.push(
      <Label>Missed <Label.Detail>{formatBalance(props.missed)}</Label.Detail></Label>
    );
  }
  if (props.rewardRelationship?.next_payment_at_block.unwrapOr(false)) {
    details.push(
      <Label>
        Next payment block:
        <Label.Detail>{props.rewardRelationship.next_payment_at_block.unwrap().toNumber()}</Label.Detail>
      </Label>
    );
  }

  return (
    <Card color='grey' className="staked-card">
      <Card.Content>
        <Image floated='right'>
          {avatar}
        </Image>
        <Card.Header><HandleView profile={props.profile} /></Card.Header>
        <Card.Meta>{props.title}</Card.Meta>
        <Card.Meta>
          <Label>
            { (props.group === WorkingGroups.ContentCurators ? 'Curator' : 'Worker') + ` ID: ${props.workerId.toString()}` }
          </Label>
        </Card.Meta>
      </Card.Content>
      { details.length > 0 && (
        <Card.Content extra>
          { showDetails && (
            <Card.Description>
              <StakeAndReward>
                {details.map((detail, index) => <div key={index}>{detail}</div>)}
              </StakeAndReward>
            </Card.Description>
          ) }
          <Button onClick={ () => setShowDetails(v => !v) } size="tiny" fluid>
            { showDetails ? 'Hide' : 'Show'} details
          </Button>
        </Card.Content>
      ) }
    </Card>
  );
}

type CountdownProps = {
  end: Date;
}

export function Countdown (props: CountdownProps) {
  let interval = -1;

  const [days, setDays] = useState<number | undefined>(undefined);
  const [hours, setHours] = useState<number | undefined>(undefined);
  const [minutes, setMinutes] = useState<number | undefined>(undefined);
  const [seconds, setSeconds] = useState<number | undefined>(undefined);

  const update = () => {
    const then = moment(props.end);
    const now = moment();
    const d = moment.duration(then.diff(now));
    setDays(d.days());
    setHours(d.hours());
    setMinutes(d.minutes());
    setSeconds(d.seconds());
  };

  interval = window.setInterval(update, 1000);

  useEffect(() => {
    update();
    return () => {
      clearInterval(interval);
    };
  }, []);

  if (!seconds) {
    return null;
  }

  return (
    <div className='countdown wrapper'>
      <Statistic size="tiny">
        <Statistic.Value>{days}</Statistic.Value>
        <Statistic.Label>Days</Statistic.Label>
      </Statistic>
      <Statistic size="tiny">
        <Statistic.Value>{hours}</Statistic.Value>
        <Statistic.Label>hours</Statistic.Label>
      </Statistic>
      <Statistic size="tiny">
        <Statistic.Value>{minutes}</Statistic.Value>
        <Statistic.Label>minutes</Statistic.Label>
      </Statistic>
      <Statistic size="tiny">
        <Statistic.Value>{seconds}</Statistic.Value>
        <Statistic.Label>seconds</Statistic.Label>
      </Statistic>
    </div>
  );
}
