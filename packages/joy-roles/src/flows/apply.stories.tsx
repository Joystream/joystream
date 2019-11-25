import React from 'react'
import { boolean, date, number, select, text, withKnobs } from '@storybook/addon-knobs'

import { u128, GenericAccountId } from '@polkadot/types'
import { Balance } from '@polkadot/types/interfaces';

import { FlowModal } from "./apply"
import {
    ApplicationStakeRequirement, RoleStakeRequirement,
	StakeType,
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
	// List of the minimum stake required to beat each rank
	const slots: Balance[] = []
	for (let i = 0; i < 20; i++) {
		slots.push(new u128((i*100)+10+i+1))

	}
    const props = {
        applications: {
            numberOfApplications: number("Applications count", 0, applicationSliderOptions, "Role rationing policy"),
            maxNumberOfApplications: number("Application max", 0, applicationSliderOptions, "Role rationing policy"),
            requiredApplicationStake: new ApplicationStakeRequirement(
                new u128(number("Application stake", 0, moneySliderOptions, "Role stakes")), 
            ),
            requiredRoleStake: new RoleStakeRequirement(
                new u128(number("Role stake", 0, moneySliderOptions, "Role stakes")), 
                           ),
        },
        creator: creator,
		transactionFee: new u128(number("Transaction fee", 500, moneySliderOptions, "Application Tx")), 
		transactionDetails: new Map<string, string>([
			["Extrinsic hash", "0xae6d24d4d55020c645ddfe2e8d0faf93b1c0c9879f9bf2c439fb6514c6d1292e"],
			["SOmething else", "abc123"],
		]),
		keypairs: [
            {
                shortName: "KP1",
                accountId: new GenericAccountId('5HZ6GtaeyxagLynPryM7ZnmLzoWFePKuDrkb4AT8rT4pU1fp'),
                balance: new u128(23342),
            },
            {
                shortName: "KP2",
                accountId: new GenericAccountId('5DQqNWRFPruFs9YKheVMqxUbqoXeMzAWfVfcJgzuia7NA3D3'),
                balance: new u128(993342),
            },
            {
                shortName: "KP3",
                accountId: new GenericAccountId('5DBaczGTDhcHgwsZzNE5qW15GrQxxdyros4pYkcKrSUovFQ9'),
                balance: new u128(242),
            },
		],
		hasConfirmStep: true,
		requiredApplicationStake: new ApplicationStakeRequirement(new u128(1)),
		requiredRoleStake: new RoleStakeRequirement(new u128(2), StakeType.AtLeast),
		maxNumberOfApplications: 0,
		numberOfApplications: 0,
		defactoMinimumStake: new u128(0),
		step: new u128(5),
        slots: slots,

    }

    return <FlowModal {...props} />
}
