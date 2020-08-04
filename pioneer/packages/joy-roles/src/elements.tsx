import React, { useEffect, useState } from 'react';
import moment from 'moment';
import { Card, Icon, Image, Label, Statistic } from 'semantic-ui-react';
import { Link } from 'react-router-dom';

import { Balance } from '@polkadot/types/interfaces';
import { formatBalance } from '@polkadot/util';
import Identicon from '@polkadot/react-identicon';
import { IProfile, MemberId } from '@joystream/types/members';
import { GenericAccountId } from '@polkadot/types';
import { LeadRoleState } from '@joystream/types/content-working-group';
import { WorkerId } from '@joystream/types/working-group';

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
  roleAccount: GenericAccountId;
  profile: IProfile;
  title: string;
  stake?: Balance;
  earned?: Balance;
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

export function GroupMemberView (props: GroupMember & inset) {
  let fluid = false;
  if (typeof props.inset !== 'undefined') {
    fluid = props.inset;
  }

  let stake = null;
  if (typeof props.stake !== 'undefined' && props.stake.toNumber() !== 0) {
    stake = (
      <Label color='green' ribbon={fluid}>
        <Icon name="shield" />
        Staked
        <Label.Detail>{formatBalance(props.stake)}</Label.Detail>
      </Label>
    );
  }

  let avatar = <Identicon value={props.roleAccount.toString()} size={50} />;
  if (typeof props.profile.avatar_uri !== 'undefined' && props.profile.avatar_uri.toString() !== '') {
    avatar = <Image src={props.profile.avatar_uri.toString()} circular className='avatar' />;
  }

  let earned = null;
  if (typeof props.earned !== 'undefined' &&
    props.earned.toNumber() > 0 &&
    !fluid) {
    earned = (
      <Card.Content extra>
        <Label>Earned <Label.Detail>{formatBalance(props.earned)}</Label.Detail></Label>
      </Card.Content>
    );
  }

  return (
    <Card color='grey' className="staked-card" fluid={fluid}>
      <Card.Content>
        <Image floated='right'>
          {avatar}
        </Image>
        <Card.Header><HandleView profile={props.profile} /></Card.Header>
        <Card.Meta>{props.title}</Card.Meta>
        <Card.Description>
          {stake}
        </Card.Description>
      </Card.Content>
      {earned}
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
