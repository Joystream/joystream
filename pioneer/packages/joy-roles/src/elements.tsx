import React, { useEffect, useState } from 'react';
import moment from 'moment';
import { Card, Icon, Image, Label, Statistic, Button, Transition } from 'semantic-ui-react';
import { Link } from 'react-router-dom';

import { Balance } from '@polkadot/types/interfaces';
import { formatBalance } from '@polkadot/util';
import Identicon from '@polkadot/react-identicon';
import { IMembership, MemberId } from '@joystream/types/members';
import { GenericAccountId } from '@polkadot/types';
import { WorkingGroups } from './working_groups';
import { RewardRelationship } from '@joystream/types/recurring-rewards';
import { formatReward } from '@polkadot/joy-utils/functions/format';
import styled from 'styled-components';

type BalanceProps = {
  balance?: Balance;
}

export function BalanceView (props: BalanceProps) {
  return (
    <div className='balance'>
      <span>Balance:</span> {formatBalance(props.balance)}
    </div>
  );
}

type ProfileProps = {
  profile: IMembership;
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
  profile: IMembership;
  title: string;
  stake?: Balance;
  rewardRelationship?: RewardRelationship;
  storage?: string;
}

export function GroupLeadView (props: GroupMember) {
  let avatar = <Identicon value={props.roleAccount.toString()} size={50} />;

  if (typeof props.profile.avatar_uri !== 'undefined' && props.profile.avatar_uri.toString() !== '') {
    avatar = <Image src={props.profile.avatar_uri.toString()} circular className='avatar' />;
  }

  const { stake, rewardRelationship, storage } = props;

  return (
    <Card color='grey' className='staked-card'>
      <Card.Content>
        <Image floated='right'>
          {avatar}
        </Image>
        <Card.Header><HandleView profile={props.profile} /></Card.Header>
        <Card.Meta>{props.title}</Card.Meta>
        <Card.Meta>
          { (props.workerId !== undefined) && (
            <Label>{ 'Worker ID: ' + props.workerId.toString() }</Label>
          ) }
        </Card.Meta>
        <Card.Description>
          <Label color='teal'>
            <Icon name='shield' />
            { props.title }
            <Label.Detail>{/* ... */}</Label.Detail>
          </Label>
        </Card.Description>
      </Card.Content>
      <GroupMemberDetails {...{ stake, rewardRelationship, storage }} />
    </Card>
  );
}

const StakeAndReward = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  grid-row-gap: 0.25em;
  margin-bottom: 1em;
`;

type GroupMemberDetailsProps = {
  rewardRelationship?: RewardRelationship;
  stake?: Balance;
  storage?: string
}

export function GroupMemberDetails (props: GroupMemberDetailsProps) {
  const [showDetails, setShowDetails] = useState(false);
  const details: JSX.Element[] = [];

  if (props.stake && props.stake.toNumber() > 0) {
    details.push(
      <Label color='green'>
        <Icon name='shield' />
        Staked
        <Label.Detail>{formatBalance(props.stake)}</Label.Detail>
      </Label>
    );
  } else {
    details.push(
      <Label>Stake <Label.Detail>NONE</Label.Detail></Label>
    );
  }

  if (props.rewardRelationship) {
    const reward = props.rewardRelationship;

    details.push(
      <Label>Reward <Label.Detail>{formatReward(reward)}</Label.Detail></Label>
    );
    details.push(
      <Label>Earned <Label.Detail>{formatBalance(reward.total_reward_received)}</Label.Detail></Label>
    );
    details.push(
      <Label>Missed <Label.Detail>{formatBalance(reward.total_reward_missed)}</Label.Detail></Label>
    );
    details.push(
      <Label>
        Next payment block:
        <Label.Detail>{props.rewardRelationship.next_payment_at_block.unwrapOr('NONE').toString()}</Label.Detail>
      </Label>
    );
  } else {
    details.push(
      <Label>Reward <Label.Detail>NONE</Label.Detail></Label>
    );
  }

  if (props.storage) {
    details.push(
      <Label>
        Worker Storage
        <Label.Detail style={{ marginTop: '5px', marginLeft: 0, display: 'block', wordBreak: 'break-word', wordWrap: 'break-word' }}>{props.storage}</Label.Detail>
      </Label>
    );
  }

  return (
    <Card.Content extra>
      <Transition visible={showDetails} animation='fade down' duration={500}>
        <Card.Description>
          <StakeAndReward>
            {details.map((detail, index) => <div key={index}>{detail}</div>)}
          </StakeAndReward>
        </Card.Description>
      </Transition>
      <Button onClick={ () => setShowDetails((v) => !v) } size='tiny' fluid>
        { showDetails ? 'Hide' : 'Show'} details
      </Button>
    </Card.Content>
  );
}

export function GroupMemberView (props: GroupMember) {
  let avatar = <Identicon value={props.roleAccount.toString()} size={50} />;

  if (typeof props.profile.avatar_uri !== 'undefined' && props.profile.avatar_uri.toString() !== '') {
    avatar = <Image src={props.profile.avatar_uri.toString()} circular className='avatar' />;
  }

  const { stake, rewardRelationship, storage } = props;

  return (
    <Card color='grey' className='staked-card'>
      <Card.Content>
        <Image floated='right'>
          {avatar}
        </Image>
        <Card.Header><HandleView profile={props.profile} /></Card.Header>
        <Card.Meta>{props.title}</Card.Meta>
        <Card.Meta>
          <Label>
            { `Worker ID: ${props.workerId.toString()}` }
          </Label>
        </Card.Meta>
      </Card.Content>
      <GroupMemberDetails {...{ stake, rewardRelationship, storage }} />
    </Card>
  );
}

type CountdownProps = {
  end: Date;
}

export function Countdown (props: CountdownProps) {
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

  useEffect(() => {
    const interval = window.setInterval(update, 1000);

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
      <Statistic size='tiny'>
        <Statistic.Value>{days}</Statistic.Value>
        <Statistic.Label>Days</Statistic.Label>
      </Statistic>
      <Statistic size='tiny'>
        <Statistic.Value>{hours}</Statistic.Value>
        <Statistic.Label>hours</Statistic.Label>
      </Statistic>
      <Statistic size='tiny'>
        <Statistic.Value>{minutes}</Statistic.Value>
        <Statistic.Label>minutes</Statistic.Label>
      </Statistic>
      <Statistic size='tiny'>
        <Statistic.Value>{seconds}</Statistic.Value>
        <Statistic.Label>seconds</Statistic.Label>
      </Statistic>
    </div>
  );
}
