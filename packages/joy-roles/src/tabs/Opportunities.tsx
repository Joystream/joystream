import React from 'react'
import Moment from 'react-moment';
import NumberFormat from 'react-number-format';
import marked from 'marked';
import CopyToClipboard from 'react-copy-to-clipboard';

import { Link } from 'react-router-dom';
import { Button, Card, Container, Grid, Header, Icon, Label, List, Message, Statistic, SemanticICONS } from 'semantic-ui-react'

import { formatBalance } from '@polkadot/util';
import { Balance } from '@polkadot/types/interfaces';

import { GroupMemberProps, GroupMemberView } from '../elements'
import { GenericJoyStreamRoleSchema } from '@joystream/types/schemas/role.schema'
import { Opening } from "@joystream/types/hiring"

import { OpeningStageClassification, OpeningState } from "../classifiers"

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

function openingStateMarkup<T>( state: OpeningState, key: string ): T {
	const markup = stateMarkup.get(state)

	if (typeof markup === "undefined") {
		return null as unknown as T
	}
	
	return (markup as any)[key]
}

export function openingClass( state: OpeningState ): string {
	return "status-" + openingStateMarkup<string>(state, "class")
}

export function openingDescription( state: OpeningState ): string {
	return openingStateMarkup<string>(state, "description")
}

function openingIcon( state: OpeningState ) {
	const icon = openingStateMarkup<SemanticICONS>(state, "icon")
	const spin = openingStateMarkup<boolean>(state, "iconSpin")

	return <Icon name={icon} loading={spin} />
}

type OpeningHeaderProps = {
	stage: OpeningStageClassification
}

export function OpeningHeader(props: OpeningHeaderProps) {

	const onCopy = () => {
		return false
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
					<Icon name="history" /> Created&nbsp;
						<Moment unix format="DD/MM/YYYY, HH:MM:SS">{props.stage.created_time.getTime()/1000}</Moment>
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

type DynamicMinimumProps = {
	dynamic_minimum: Balance
}

export type OpeningBodyProps = DynamicMinimumProps & StakeRequirementProps & {
	text: GenericJoyStreamRoleSchema
	creator: GroupMemberProps
	stage: OpeningStageClassification
	applications: OpeningBodyApplicationsStatusProps
}

type OpeningBodyCTAProps = OpeningBodyApplicationsStatusProps & OpeningHeaderProps & OpeningBodyProps

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
		console.log(props)
		const balance = !props.dynamic_minimum.isZero() ? props.dynamic_minimum : props.application_stake.hard.add(props.role_stake.hard)
		const plural = (props.application_stake.anyRequirement() && props.role_stake.anyRequirement()) ? "s totalling" : " of"
		message = (
			<Message warning>
				<Icon name="warning sign" /> Stake{plural} at least <strong>{formatBalance(balance)}</strong> required!
			</Message>
			)
		}

	return (
		<Container>
			<Button icon fluid positive size="huge">
				APPLY NOW
				<Icon name="angle right" /> 
			</Button>
			{message}
		</Container>
	)
}

export enum StakeType {
	Fixed = 0,
	AtLeast,
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
}

export class ApplicationStakeRequirement extends StakeRequirement {
	describe(name:string) {
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

export class RoleStakeRequirement extends StakeRequirement {
	describe(name:string) {
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

export type StakeRequirementProps = DynamicMinimumProps & {
	application_stake: ApplicationStakeRequirement
	role_stake: RoleStakeRequirement
	application_max: number
}

function hasAnyStake(props: StakeRequirementProps): boolean {
	return props.application_stake.anyRequirement() || props.role_stake.anyRequirement()
}


class messageState {
	positive: boolean = true
	warning: boolean = false
	negative: boolean = false

	setPositive():void {
		this.positive = true
		this.warning = false
		this.negative = false
	}

	setWarning():void {
		this.positive = false
		this.warning = true
		this.negative = false
	}

	setNegative():void {
		this.positive = false
		this.warning = false
		this.negative = true
	}
}

export function OpeningBodyStakeRequirement(props: StakeRequirementProps) {
	if (!hasAnyStake(props)) {
		return null
	}

	const plural = (props.application_stake.anyRequirement() && props.role_stake.anyRequirement()) ? "s" : null
	let title = <Message.Header color="orange" as='h5'><Icon name="shield" /> Stake{plural} required!</Message.Header>
	let explanation = null
	if (!props.dynamic_minimum.isZero()) {
		title = <Message.Header color="orange" as='h5'><Icon name="shield" /> Increased stake{plural} required!</Message.Header>
		explanation = (
			<p>
				However, in order to be in the top {props.application_max} candidates, you wil need to stake at least <strong>{formatBalance(props.dynamic_minimum)} in total</strong>.
			</p>
		)
	}

	return (
		<Message className="stake-requirements" warning>
			{title}
			{props.application_stake.describe()}
			{props.role_stake.describe()}
			{explanation}
		</Message>
	)
}

export type OpeningBodyApplicationsStatusProps = StakeRequirementProps & {
	application_count: number
	application_max: number
}

function applicationImpossible(props: OpeningBodyApplicationsStatusProps): boolean {
	return props.application_max > 0 && 
		   (props.application_count >= props.application_max) && 
		   !hasAnyStake(props)
}

function applicationPossibleWithIncresedStake(props: OpeningBodyApplicationsStatusProps): boolean {
	return props.application_max > 0 && 
		   (props.application_count >= props.application_max) && 
		   hasAnyStake(props)
}

export function OpeningBodyApplicationsStatus(props: OpeningBodyApplicationsStatusProps) {
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

	if (props.application_max > 0) {
		max_applications = (
			<span>
				/
				<NumberFormat value={props.application_max}
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
			<p>Only the top {props.application_max} applications{order} will be considered for this role. {disclaimer}</p>
		)
	}

	return (
		<Message positive={msg.positive} warning={msg.warning} negative={msg.negative}>
			<Statistic size="small">
				<Statistic.Value>
					<NumberFormat value={props.application_count}
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

export function OpeningBody(props: OpeningBodyProps) {
	const jobDesc = marked(props.text.job.description || '')
	return (
		<Grid columns="equal">
			<Grid.Column width={10} className="summary">
				<Card.Header>
					<OpeningReward text={props.text.reward} />
				</Card.Header>
				<h4 className="headline">{props.text.headline}</h4>
				<h5>Role description</h5>
				<div dangerouslySetInnerHTML={{__html: jobDesc}} /> 
				<h5>Hiring process details</h5>
				<List>
					<List.Item>
						<List.Icon name="clock" />
							<List.Content>
								The maximum review period for this opening is <strong>43,200 blocks</strong> (approximately <strong>3 days</strong>).
						</List.Content>
					</List.Item>
				</List>
			</Grid.Column>
			<Grid.Column width={6} className="details">
				<OpeningBodyApplicationsStatus {...props.applications} />
				<OpeningBodyStakeRequirement {...props.applications} dynamic_minimum={props.dynamic_minimum} />
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

type Props = OpeningHeaderProps & DynamicMinimumProps & {
	opening: Opening
	creator: GroupMemberProps
	applications: OpeningBodyApplicationsStatusProps
}

export function OpeningView(props: Props) {
	const hrt = props.opening.human_readable_text

	if (typeof hrt === "undefined") {
		return null
	} else if (typeof hrt === "string") {
		console.log(hrt)
		return "FIXME: what do we do?"
	}

	const text = hrt as GenericJoyStreamRoleSchema

	return (
		<Container className={"opening "+openingClass(props.stage.state)}>
			<h3>{text.job.title}</h3>
			<Card fluid className="container">
				<Card.Content className="header">
					<OpeningHeader stage={props.stage} />
				</Card.Content>
				<Card.Content className="main">
					<OpeningBody text={text} 
						         creator={props.creator} 
						         stage={props.stage} 
								applications={props.applications}
								dynamic_minimum={props.dynamic_minimum}/>
				</Card.Content>
			</Card>
		</Container>
	)
}
