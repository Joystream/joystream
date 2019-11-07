import React from 'react'
import { withKnobs } from '@storybook/addon-knobs'
import { Card, Container } from 'semantic-ui-react'

import { openingClass, OpeningHeader } from "./Opportunities"

import { OpeningStageClassification, OpeningState } from "../classifiers"

import 'semantic-ui-css/semantic.min.css'
import '@polkadot/joy-roles/index.sass'

export default { 
	title: 'Roles / Components / Opportunities groups tab / Elements',
	decorators: [withKnobs],
}

function yesterday(): Date {
	const d = new Date()
	d.setDate(d.getDate() - 1)
	return d
}

export function OpeningHeaderFragment(){
	const stages:OpeningStageClassification[] = [
		{
			uri: "https://some.url/#1",
			state: OpeningState.WaitingToBegin,
			starting_block: 2956498,
			starting_block_hash: "somehash",
			created_time: yesterday(),
		},
		{
			uri: "https://some.url/#1",
			state: OpeningState.AcceptingApplications,
			starting_block: 2956498,
			starting_block_hash: "somehash",
			created_time: yesterday(),
		},
		{
			uri: "https://some.url/#1",
			state: OpeningState.InReview,
			starting_block: 102456,
			starting_block_hash: "somehash",
			created_time: yesterday(),
		},
		{
			uri: "https://some.url/#1",
			state: OpeningState.Complete,
			starting_block: 10345,
			starting_block_hash: "somehash",
			created_time: yesterday(),
		},
		{
			uri: "https://some.url/#1",
			state: OpeningState.Cancelled,
			starting_block: 104,
			starting_block_hash: "somehash",
			created_time: yesterday(),
		},
	]

	return (
		<Container>
			{stages.map((stage, key) => (
				<Container className={"inner opening "+openingClass(stage.state)} key={key}>
					<Card fluid className="container">
						<Card.Content className="header">
							<OpeningHeader stage={stage} />
						</Card.Content>
					</Card>
				</Container>
			))}
		</Container>
	)
}	
