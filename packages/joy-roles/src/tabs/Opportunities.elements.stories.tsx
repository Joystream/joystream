import React from 'react'
import { boolean, number, text, withKnobs } from '@storybook/addon-knobs'
import { Card } from 'semantic-ui-react'

import { OpeningHeader } from "./Opportunities"

import 'semantic-ui-css/semantic.min.css'
import '@polkadot/joy-roles/index.sass'

export default { 
	title: 'Roles / Components / Opportunities groups tab / Elements',
	decorators: [withKnobs],
}

export function OpeningHeaderFragment(){
	return (
		<Card fluid className="status-active">
			<Card.Content className="header">
				<OpeningHeader />
			</Card.Content>
		</Card>
	)
}	
