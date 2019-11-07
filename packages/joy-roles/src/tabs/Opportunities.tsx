import React from 'react'
import Moment from 'react-moment';
import NumberFormat from 'react-number-format';
import marked from 'marked';
import CopyToClipboard from 'react-copy-to-clipboard';

import { Link } from 'react-router-dom';
import { Button, Card, Container, Grid, Icon, Label, List, Message, Statistic, SemanticICONS } from 'semantic-ui-react'

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

export type OpeningBodyProps = {
	text: GenericJoyStreamRoleSchema
	creator: GroupMemberProps
	stage: OpeningStageClassification
}

function OpeningBodyCTAView(props: OpeningHeaderProps) {
	if (props.stage.state != OpeningState.AcceptingApplications) {
		return null
	}

	return (
		<Container>
			<Button icon fluid positive size="huge">
				APPLY NOW
				<Icon name="angle right" /> 
			</Button>
			<Message positive>
				<Icon name="check circle" /> No stake required
			</Message>
		</Container>
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
				<Message positive>
					<Statistic size="small">
						<Statistic.Value>15</Statistic.Value> 
						<Statistic.Label>Applications</Statistic.Label>
					</Statistic>
					<p>
						All applications will be considered during the review period.
					</p>
				</Message>
				<h5>Group lead</h5>
				<GroupMemberView {...props.creator} inset={true} />
				<OpeningBodyCTAView {...props} />
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

type Props = OpeningHeaderProps & {
	opening: Opening
	creator: GroupMemberProps
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
					<OpeningBody text={text} creator={props.creator} stage={props.stage} />
				</Card.Content>
			</Card>
		</Container>
	)
}
