import React from 'react'
import marked from 'marked';

import { Button, Card, Container, Grid, Icon, Label, List, Message, Statistic } from 'semantic-ui-react'

import { GroupMemberProps, GroupMemberView } from '../elements'
import { GenericJoyStreamRoleSchema } from '@joystream/types/schemas/role.schema'
import { Opening } from "@joystream/types/hiring"

type Props = {
	opening: Opening
	creator: GroupMemberProps
}

function OpeningHeader(props: Props) {
	return (
		<Grid columns="equal">
			<Grid.Column className="status">
				<Label color="green" ribbon size="large">
					<Icon name="heart" />
					Accepting applications
				</Label>
			</Grid.Column>
			<Grid.Column className="meta" textAlign="right">
				<Label>
					<Icon name="history" /> Created
						10/05/2019, 16:29:54 
					<Label.Detail>
						<a href=""><Icon name="cube" />122</a>
					</Label.Detail>
				</Label>
				<a href="">
					<Label>
						<Icon name="linkify" /> Copy link
					</Label>
				</a>
			</Grid.Column>
		</Grid>
	)
}

type OpeningBodyProps = {
	text: GenericJoyStreamRoleSchema
	creator: GroupMemberProps
}

function OpeningBody(props: OpeningBodyProps) {
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
				<Container>
					<Button icon fluid positive size="huge">
						APPLY NOW
						<Icon name="angle right" /> 
					</Button>
					<Message positive>
						<Icon name="check circle" /> No stake required
					</Message>
				</Container>
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
		<Container className="opening">
			<h3>{text.job.title}</h3>
			<Card fluid color="green">
				<Card.Content className="status-active">
					<OpeningHeader {...props} />
				</Card.Content>
				<Card.Content className="main">
					<OpeningBody text={text} creator={props.creator} />
				</Card.Content>
			</Card>
		</Container>
	)
}
