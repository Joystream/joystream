import React from 'react'
import { Header,  Card, Icon, Image, Label, Message, Table } from 'semantic-ui-react';
import { Link } from 'react-router-dom';

import { Balance } from '@polkadot/types/interfaces';
import { formatBalance } from '@polkadot/util';
import Identicon from '@polkadot/react-identicon';
import { Actor } from '@joystream/types/roles';
import { Profile } from '@joystream/types/members';
import { Text } from '@polkadot/types';

type ActorProps = {
    actor: Actor
}

type BalanceProps = {
    balance?: Balance
}

export function BalanceView(props: BalanceProps) {
    return (
        <div className="balance">
            <span>Balance:</span> {formatBalance(props.balance)}
        </div>
    )
}

type MemoProps = ActorProps & {
    memo?: Text
}

export function MemoView(props: MemoProps) {
	if (typeof props.memo === "undefined") {
		return null
	}

    return (
        <div className="memo">
            <span>Memo:</span> {props.memo.toString()}
				<Link to={`#/addressbook/memo/${props.actor.account.toString()}`}>{' view full memo'}</Link>
        </div>
    )
}

type ProfileProps = {
	profile: Profile
}

export function HandleView(props: ProfileProps) {
	if (typeof props.profile === "undefined") {
		return null
	}

    return (
		<Link to={`#/members/${props.profile.handle.toString()}`}>{props.profile.handle.toString()}</Link>
    )
}

type MemberProps = ActorProps & BalanceProps & ProfileProps

export function MemberView(props: MemberProps) {
	let avatar = <Identicon value={props.actor.account.toString()} size="50"  />
	if (typeof props.profile.avatar_uri !== "undefined") {
		avatar = <Image src={props.profile.avatar_uri.toString()} circular className='avatar' />
	}

    return (
		<Header as='h4' image>
			{avatar}
			<Header.Content>
				<HandleView profile={props.profile} />
				<BalanceView balance={props.balance} />
			</Header.Content>
	    </Header>
    )
}

type ActorDetailsProps = MemoProps & BalanceProps

export function ActorDetailsView(props: ActorDetailsProps) {
    return (
        <div className="actor-summary" id={props.actor.account.toString()}>
            {props.actor.account.toString()}
            <MemoView actor={props.actor} memo={props.memo} />
        </div>
    )
}

export type GroupMemberProps = {
	actor: Actor
	profile: Profile
	title: string
	lead: boolean
	stake?: Balance 	
	earned?: Balance
	inset?: boolean
}

export function GroupMemberView(props: GroupMemberProps) {
  let fluid = false
	if (typeof props.inset !== "undefined") {
    fluid = props.inset
  }

	let stake = null
	if (typeof props.stake !== "undefined" && props.stake.toNumber() !== 0) {
    stake = (
      <Label color={props.lead ? 'teal' : 'green'} ribbon={fluid ? 'right' : 'left'}>
        <Icon name="shield" /> 
        Staked 
        <Label.Detail>{formatBalance(props.stake)}</Label.Detail>
      </Label>
    )
	}

	let avatar = <Identicon value={props.actor.account.toString()} size="50"  />
	if (typeof props.profile.avatar_uri !== "undefined") {
		avatar = <Image src={props.profile.avatar_uri.toString()} circular className='avatar' />
	}

  let earned = null
  if (typeof props.earned !== "undefined" && 
      props.earned.toNumber() > 0 &&
      !fluid) {
    earned = (
      <Card.Content extra>
        <Label>Earned <Label.Detail>{formatBalance(props.earned)}</Label.Detail></Label>
      </Card.Content>
    )
  }

	return (
    <Card color={props.lead ? 'teal' : 'grey'} className="staked-card" fluid={fluid}>
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
	)
}


