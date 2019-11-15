import React from 'react'
import { boolean, date, number, select, text, withKnobs } from '@storybook/addon-knobs'

import { u128 } from '@polkadot/types'

import { FlowModal } from "./apply"
import {
    OpeningBodyApplicationsStatusProps,
	ApplicationStakeRequirement, RoleStakeRequirement,
} from '../tabs/Opportunities'

import { creator } from "../tabs/Opportunities.stories"

import 'semantic-ui-css/semantic.min.css'
import '@polkadot/joy-roles/index.sass'

export default { 
    title: 'Roles / Components / Apply flow',
    decorators: [withKnobs],
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

export function ApplicationSandbox() {

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


	return <FlowModal applications={applications} creator={creator} />
}
