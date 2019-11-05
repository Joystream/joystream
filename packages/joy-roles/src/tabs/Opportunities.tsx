import React from 'react'
import marked from 'marked';

import { Button, Card, Container, Grid, Icon, Label, Statistic } from 'semantic-ui-react'

import { GroupMemberProps, GroupMemberView } from '../elements'
import { GenericJoyStreamRoleSchema } from '@joystream/types/schemas/role.schema'
import { Opening } from "@joystream/types/hiring"

type Props = {
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
	const jobDesc = marked(text.job.description || '')

	return (
		<Container className="opening">
			<h3>{text.job.title}</h3>
			<Card fluid color="green">
				<Card.Content className="status-active">
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
								<Label.Detail>
									10/05/2019, 16:29:54 (<a href="">#122</a>)
								</Label.Detail>
							</Label>
							<a href="">
								<Label>
									<Icon name="linkify" /> Copy link
								</Label>
							</a>
						</Grid.Column>
					</Grid>
				</Card.Content>
				<Card.Content className="main">
					<Grid columns="equal">
						<Grid.Column width={10} className="summary">
							<Card.Header>
								<Statistic size="small">
									<Statistic.Label>Reward</Statistic.Label>
									<Statistic.Value>{text.reward}</Statistic.Value> 
								</Statistic>
							</Card.Header>
							<h4 class="headline">{text.headline}</h4>
							<h5>Role description</h5>
							<div dangerouslySetInnerHTML={{__html: jobDesc}} /> 
							<h5>Hiring process details</h5>
							<p>The maximum review period for this opening is 43,200 blocks (approximately 3 days).</p>
						</Grid.Column>
						<Grid.Column width={6} className="details">
							<Statistic size="small">
								<Statistic.Label>Applications</Statistic.Label>
								<Statistic.Value>15</Statistic.Value> 
							</Statistic>

							<h5>Group lead</h5>
							<GroupMemberView {...props.creator} inset={true} />
							<Container>
								<Button fluid positive size="large">
									Apply
								</Button>
							</Container>
						</Grid.Column>
					</Grid>
				</Card.Content>
			</Card>
		</Container>
	)
}
