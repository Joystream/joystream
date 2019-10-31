import React from 'react'
import { Header,  Card, Icon, Image, Label, Message, Table } from 'semantic-ui-react';
import { Link } from 'react-router-dom';

import { Balance } from '@polkadot/types/interfaces';
import { formatBalance } from '@polkadot/util';
import Identicon from '@polkadot/react-identicon';
import { Actor } from '@joystream/types/roles';
import { Text } from '@polkadot/types';

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

type MemoProps = {
    actor: Actor
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

}

export function HandleView(props: ProfileProps) {
	if (typeof props.profile === "undefined") {
		return null
	}

    return (
		<Link to={`#/members/${props.profile.handle.toString()}`}>{props.profile.handle.toString()}</Link>
    )
}

type MemberProps = BalanceProps & ProfileProps & {
    actor: Actor
}

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

export function ActorDetailsView(props: MemoProps & BalanceProps) {
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
}

export function GroupMemberView(props: GroupMemberProps) {
	let stake = null
	if (typeof props.stake !== "undefined") {
	    stake = <Label color={props.lead ? 'teal' : 'green'} ribbon><Icon name="check circle" /> Staked <Label.Detail>{formatBalance(props.stake)}</Label.Detail></Label>
	}

	let avatar = <Identicon value={props.actor.account.toString()} size="50"  />
	if (typeof props.profile.avatar_uri !== "undefined") {
		avatar = <Image src={props.profile.avatar_uri.toString()} circular className='avatar' />
	}

	return (
    <Card color={props.lead ? 'teal' : 'grey'} className="staked-card">
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
      <Card.Content extra>
		  <Label>Earned <Label.Detail>{formatBalance(props.earned)}</Label.Detail></Label>
      </Card.Content>
    </Card>
	)
}


