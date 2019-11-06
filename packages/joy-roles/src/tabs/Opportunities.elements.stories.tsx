import React from 'react'
import { boolean, number, text, withKnobs } from '@storybook/addon-knobs'
import { Card, Container } from 'semantic-ui-react'

import { OpeningHeader } from "./Opportunities"
import { AcceptingApplications, ActiveOpeningStage, OpeningStage, OpeningStageActive } from "@joystream/types/hiring"

import { OpeningStageClassification } from "../classifiers"

import 'semantic-ui-css/semantic.min.css'
import '@polkadot/joy-roles/index.sass'

export default { 
	title: 'Roles / Components / Opportunities groups tab / Elements',
	decorators: [withKnobs],
}

export function OpeningHeaderFragment(){
	const stages:OpeningStageClassification[] = [
    {
      description: "Waiting to begin",
      class: "waiting-to-begin",
      starting_block: 100,
		},
		{
			description: "Accepting applications",
			class: "active",
			starting_block: 100,
		},
		{
			description: "Applications in review",
			class: "in-review",
			starting_block: 100,
    },
    {
      description: "Cancelled",
      class: "cancelled",
      starting_block: 100,
		},
	]

	return (
		<Container>
			{stages.map((stage, key) => (
				<Container className={"inner opening status-"+stage.class} key={key}>
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
