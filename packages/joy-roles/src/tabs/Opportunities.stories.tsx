import React from 'react'
import { text, withKnobs } from '@storybook/addon-knobs'

import { Text } from '@polkadot/types'

import { Opening } from "@joystream/types/hiring"
import { OpeningView } from "./Opportunities"

import 'semantic-ui-css/semantic.min.css'
import '@polkadot/joy-roles/index.css'

export default { 
	title: 'Roles / Opportunities groups tab',
	decorators: [withKnobs],
}

function newMockHumanReadableText(obj: any) {
	return new Text(JSON.stringify(obj))
}

export function JobAd(){
	const opening= new Opening({
		human_readable_text: newMockHumanReadableText({
			version: 1,
			headline: text("Headline", "help us curate awesome content"),
			job: {
				title: text("Job title", "Content curator"),
				description: text("Job description", "<p>Lorem ipsum</p>")
			},
			reward: text("Reward", "10 JOY per block"),
			creator: {
				membership: {
					handle: text("Creator handle", "ben")
				}
			},
			process: {
				details: [
					"A"
				]
			}
		}),
	})

	return (
		<OpeningView opening={opening} />
	)
}	
