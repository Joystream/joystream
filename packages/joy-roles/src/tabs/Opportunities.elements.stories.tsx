import React from 'react'
import { number,  text, withKnobs } from '@storybook/addon-knobs'
import { Card, Container } from 'semantic-ui-react'

import { openingClass, OpeningBody, OpeningBodyProps, OpeningHeader } from "./Opportunities"
import { opening, creator, yesterday } from "./Opportunities.stories"

import { OpeningStageClassification, OpeningState } from "../classifiers"

import 'semantic-ui-css/semantic.min.css'
import '@polkadot/joy-roles/index.sass'

export default { 
	title: 'Roles / Components / Opportunities groups tab / Elements',
	decorators: [withKnobs],
}

export function OpeningHeaderByState(){
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

type fixtureProps = OpeningBodyProps & {
	_description:string
}

export function OpeningBodyFragment(){
	const permutations:OpeningBodyProps[] = [
		{
			_description: "Waiting to start; no limit; no stakes",
			text: opening.human_readable_text,
			creator: creator,
			stage: {
				uri: text("URL (to copy)", "https://some.url/#1", "Opening"),
				state: OpeningState.WaitingToBegin,
				starting_block: number("Created block", 2956498, {}, "Opening"),
				starting_block_hash: "somehash",
				created_time: yesterday(),
			},
		},
		{
			_description: "Accepting applications; no limit; no stakes",
			text: opening.human_readable_text,
			creator: creator,
			stage: {
				uri: text("URL (to copy)", "https://some.url/#1", "Opening"),
				state: OpeningState.AcceptingApplications,
				starting_block: number("Created block", 2956498, {}, "Opening"),
				starting_block_hash: "somehash",
				created_time: yesterday(),
			},
		},
	]

	return (
		<Container>
			{permutations.map((permutation, key) => (
				<Container className={"outer opening "+openingClass(permutation.stage.state)} key={key}>
					<h4>{permutation._description}</h4>
					<Card fluid className="container">
						<Card.Content className="main">
							<OpeningBody {...permutation} />
						</Card.Content>
					</Card>
				</Container>
			))}
		</Container>
	)
}
