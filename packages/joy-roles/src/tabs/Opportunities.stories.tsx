import React from 'react'
import { boolean, date, number, select, text, withKnobs } from '@storybook/addon-knobs'
import * as faker from 'faker'

import { Text, u128 } from '@polkadot/types'

import { Actor } from "@joystream/types/roles"
import { Opening } from "@joystream/types/hiring"
import { OpeningView, OpeningBodyApplicationsStatusProps, 
		 ApplicationStakeRequirement, RoleStakeRequirement,
		 stateMarkup } from "./Opportunities"

import { OpeningStageClassification, OpeningState } from "../classifiers"

import 'semantic-ui-css/semantic.min.css'
import '@polkadot/joy-roles/index.sass'

export default { 
    title: 'Roles / Components / Opportunities groups tab',
    decorators: [withKnobs],
    excludeStories: ['tomorrow', 'yesterday', 'opening', 'creator', 'stateOptions'],
}

export function tomorrow(): Date {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return d
}

export function yesterday(): Date {
    const d = new Date()
    d.setDate(d.getDate() - 1)
    return d
}

function newMockHumanReadableText(obj: any) {
    return new Text(JSON.stringify(obj))
}

export const opening = new Opening({
	max_review_period_length: 50000,
    human_readable_text: newMockHumanReadableText({
        version: 1,
        headline: text("Headline", "Help us curate awesome content", "Role"),
        job: {
            title: text("Job title", "Content curator", "Role"),
            description: text("Job description", faker.lorem.paragraphs(4), "Role")
        },
        reward: text("Reward", "10 JOY per block", "Role"),
        creator: {
            membership: {
                handle: text("Creator handle", "ben", "Role")
            }
        },
        process: {
            details: [
                "Some custom detail"
            ]
        }
    }),
})

export const creator = {
    actor: new Actor({member_id: 1, account: '5HZ6GtaeyxagLynPryM7ZnmLzoWFePKuDrkb4AT8rT4pU1fp'}),
    profile: { 
        handle: new Text(text("Handle","benholdencrowther", "Creator")),
    },
    title: text('Title', 'Group lead', "Creator"),
    lead: boolean('Lead member', true, "Creator"),
    stake: new u128(number('Stake', 10, {}, "Creator")),
}

const stateOptions:any = function() {
    const options:any = {}
    stateMarkup.forEach( (value, key) => {
        options[value.description] = key
    })
    return options
}()

export function OpportunitySandbox(){
    const stage:OpeningStageClassification = {
        uri: text("URL (to copy)", "https://some.url/#1", "Opening"),
        state: select("State", stateOptions, OpeningState.AcceptingApplications, "Opening"),
        starting_block: number("Created block", 2956498, {}, "Opening"),
        starting_block_hash: "somehash",
        created_time: yesterday(),
		review_end_block: 3956498,
		review_end_time: tomorrow(),
    }

    const applicationSliderOptions = {
        range: true,
        min: 0,
        max: 20,
        step: 1,
    }

    const moneySliderOptions = {
        range: true,
        min: 0,
        max: 1000000,
        step: 500,
    }

    const applications:OpeningBodyApplicationsStatusProps ={
        application_count: number("Applications count", 0, applicationSliderOptions, "Role rationing policy"),
        application_max: number("Application max", 0, applicationSliderOptions, "Role rationing policy"),
        application_stake: new ApplicationStakeRequirement(
                                new u128(number("Application stake", 500, moneySliderOptions, "Role stakes")), 
                           ),
        role_stake: new RoleStakeRequirement(
                                new u128(number("Role stake", 0, moneySliderOptions, "Role stakes")), 
                           ),
    }

	const dynamic_minimum:Balance = new u128(number("Dynamic min stake", 0, moneySliderOptions, "Role stakes"))

    return (
		<OpeningView opening={opening} 
			creator={creator} 
			stage={stage} 
			applications={applications} 
			dynamic_minimum={dynamic_minimum} 
			block_time_in_seconds={3}
		/>
    )
}   
