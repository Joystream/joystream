import React from 'react'
import { text, withKnobs } from '@storybook/addon-knobs'
import * as faker from 'faker'

import { Text } from '@polkadot/types'

import { Opening } from "@joystream/types/hiring"
import { OpeningView } from "./Opportunities"

import 'semantic-ui-css/semantic.min.css'
import '@polkadot/joy-roles/index.sass'

export default { 
	title: 'Roles / Opportunities groups tab',
	decorators: [withKnobs],
}

function newMockHumanReadableText(obj: any) {
	return new Text(JSON.stringify(obj))
}

export function OpenStakelessUnrestricted(){
	const opening = new Opening({
		human_readable_text: newMockHumanReadableText({
			version: 1,
			headline: text("Headline", "help us curate awesome content", "Role"),
			job: {
				title: text("Job title", "Content curator", "Role"),
				description: text("Job description", faker.lorem.paragraphs(3), "Role")
			},
			reward: text("Reward", "10 JOY per block", "Role"),
			creator: {
				membership: {
					handle: text("Creator handle", "ben", "Role")
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
