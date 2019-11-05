import React from 'react'
import { boolean, number, text, withKnobs } from '@storybook/addon-knobs'
import * as faker from 'faker'

import { Text, u128 } from '@polkadot/types'

import { Actor } from "@joystream/types/roles"
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
			headline: text("Headline", "Help us curate awesome content", "Role"),
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

	const creator = {
		actor: new Actor({member_id: 1, account: '5HZ6GtaeyxagLynPryM7ZnmLzoWFePKuDrkb4AT8rT4pU1fp'}),
		profile: { 
			handle: new Text(text("Handle","benholdencrowther", "Creator")),
		},
		title: text('Title', 'Group lead', "Creator"),
		lead: boolean('Lead member', true, "Creator"),
		stake: new u128(number('Stake', 10, {}, "Creator")),
	}

	return (
		<OpeningView opening={opening} creator={creator} />
	)
}	
