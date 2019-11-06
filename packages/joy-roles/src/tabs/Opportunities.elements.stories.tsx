import React from 'react'
import { boolean, number, text, withKnobs } from '@storybook/addon-knobs'
import { Card, Container } from 'semantic-ui-react'

import { OpeningHeader } from "./Opportunities"
import { AcceptingApplications, ActiveOpeningStage, OpeningStage, OpeningStageActive } from "@joystream/types/hiring"

import 'semantic-ui-css/semantic.min.css'
import '@polkadot/joy-roles/index.sass'

export default { 
	title: 'Roles / Components / Opportunities groups tab / Elements',
	decorators: [withKnobs],
}

export function OpeningHeaderFragment(){
	const stage = new OpeningStage({ 
			openingStageActive: new OpeningStageActive({
				stage: new ActiveOpeningStage({
					acceptingApplications: new AcceptingApplications({
					started_accepting_applicants_at_block: 100,
				})
			})
		})
	})

	return (
		<Container className="opening status-active">
			<Card fluid className="container">
				<Card.Content className="header">
					<OpeningHeader stage={stage} />
				</Card.Content>
			</Card>
		</Container>
	)
}	
