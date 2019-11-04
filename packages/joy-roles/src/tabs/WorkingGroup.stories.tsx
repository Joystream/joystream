import React from 'react'
import { boolean, number, text, withKnobs } from '@storybook/addon-knobs'

import { Balance } from '@polkadot/types/interfaces'
import { Text, u128 } from '@polkadot/types'

import { Actor } from '@joystream/types/roles'
import { Profile } from '@joystream/types/members';

import { ContentCurators, StorageAndDistribution } from "@polkadot/joy-roles/tabs/WorkingGroup"
import { GroupMemberProps } from "@polkadot/joy-roles/elements"

import 'semantic-ui-css/semantic.min.css'
import '@polkadot/joy-roles/index.sass'

export default { 
	title: 'Roles / Working groups tab',
    decorators: [withKnobs],
}

export function ContentCuratorsSection(){
	const members:GroupMemberProps[] = [
		{
			actor: new Actor({member_id: 1, account: '5HZ6GtaeyxagLynPryM7ZnmLzoWFePKuDrkb4AT8rT4pU1fp'}),
			profile: { 
				handle: new Text(text("Handle", "benholdencrowther", "Ben")),
				avatar_uri: new Text(text("Avatar URL", "https://www.benholdencrowther.com/wp-content/uploads/2019/03/Hanging_Gardens_of_Babylon.jpg", "Ben")),
			},
			title: text("Title", 'Curation lead', "Ben"),
			lead: boolean("Lead", true, "Ben"),
			stake: new u128(number("Stake", 10101, {}, "Ben")),
			earned: new u128(number("Earned", 347829, {}, "Ben")),
		},
		{
			actor: new Actor({member_id: 2, account: '5DfJWGbBAH8hLAg8rcRYZW5BEZbE4BJeCQKoxUeqoyewLSew'}),
			profile: { handle: new Text(text("Handle", "bwhm0", "Martin")) },
			title: text('Title', 'Content curator', 'Martin'),
			lead: boolean("Lead", false, "Martin"),
			stake: new u128(number("Stake", 10101, {}, "Martin")),
			earned: new u128(number("Earned", 347829, {}, "Martin")),
		},
		{
			actor: new Actor({member_id: 3, account: '5DQqNWRFPruFs9YKheVMqxUbqoXeMzAWfVfcJgzuia7NA3D3'}),
			profile: { 
				handle: new Text("yourheropaul"),
				avatar_uri: new Text("https://yhp.io/img/paul.svg"),
			},
			title: text('Title', 'Content curator', 'Paul'),
			lead: boolean("Lead", false, "Paul"),
			stake: new u128(number("Stake", 10101, {}, "Paul")),
			earned: new u128(number("Earned", 347829, {}, "Paul")),
		},
		{
			actor: new Actor({member_id: 2, account: '5GSMNn8Sy8k64mGUWPDafjMZu9bQNX26GujbBQ1LeJpNbrfg'}),
			profile: { 
				handle: new Text("alex_joystream"),
				avatar_uri: new Text("https://avatars2.githubusercontent.com/u/153928?s=200&v=4"),
			},
			title: text('Title', 'Content curator', 'Alex'),
			lead: boolean("Lead", false, "Alex"),
			stake: new u128(number("Stake", 10101, {}, "Alex")),
			earned: new u128(number("Earned", 347829, {}, "Alex")),
		},
		{
			actor: new Actor({member_id: 3, account: '5Gn9n7SDJ7VgHqHQWYzkSA4vX6DCmS5TFWdHxikTXp9b4L32'}),
			profile: { 
				handle: new Text("mokhtar"), 
				avatar_uri: new Text("https://avatars2.githubusercontent.com/u/1621012?s=460&v=4"),
			},
			title: text('Title', 'Content curator', 'Mokhtar'),
			lead: boolean("Lead", false, "Mokhtar"),
			stake: new u128(number("Stake", 10101, {}, "Mokhtar")),
			earned: new u128(number("Earned", 347829, {}, "Mokhtar")),
		},
	]

	return (
		<ContentCurators members={members} rolesAvailable={boolean('Roles available', true)}/>
	)
}

export const StorageProvidersSection = () => {
	const balances = new Map<string, Balance>([
		['5HZ6GtaeyxagLynPryM7ZnmLzoWFePKuDrkb4AT8rT4pU1fp', new u128(101)],
	])

	const memos = new Map<string, Text>([
		['5HZ6GtaeyxagLynPryM7ZnmLzoWFePKuDrkb4AT8rT4pU1fp', new Text("hello")]
	])

	const profiles = new Map<number, Profile>([
		[1, { handle: new Text("bwhm0") }],
		[2, { handle: new Text("benholdencrowther"), 
			  avatar_uri: new Text("https://www.benholdencrowther.com/wp-content/uploads/2019/03/Hanging_Gardens_of_Babylon.jpg") }],
	])

	const storageProviders:Actor[] = [
		new Actor({member_id: 1, account: '5HZ6GtaeyxagLynPryM7ZnmLzoWFePKuDrkb4AT8rT4pU1fp'}),
		new Actor({member_id: 2, account: '5DQqNWRFPruFs9YKheVMqxUbqoXeMzAWfVfcJgzuia7NA3D3'}),
	];

	return (
		<div>
			<StorageAndDistribution 
				actors={storageProviders} 
				balances={balances} 
				memos={memos} 
				profiles={profiles} 
			/>
		</div>
	)
}
