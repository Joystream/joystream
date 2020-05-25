import React from 'react'
import { boolean, number, text, withKnobs } from '@storybook/addon-knobs'

import { Balance } from '@polkadot/types/interfaces'
import { Text, u128, GenericAccountId } from '@polkadot/types'

import { Actor } from '@joystream/types/lib/roles'
import { IProfile, MemberId } from '@joystream/types/lib/members';

import { ContentCurators, StorageAndDistribution } from "@polkadot/joy-roles/tabs/WorkingGroup"
import { GroupMember } from "../elements"

import { mockProfile } from '../mocks'

import 'semantic-ui-css/semantic.min.css'
import '@polkadot/joy-roles/index.sass'

export default {
  title: 'Roles / Components / Working groups tab',
  decorators: [withKnobs],
}

export function ContentCuratorsSection() {
  const members: GroupMember[] = [
    {
      memberId: new MemberId(1),
      roleAccount: new GenericAccountId('5HZ6GtaeyxagLynPryM7ZnmLzoWFePKuDrkb4AT8rT4pU1fp'),
      profile: mockProfile(
        text("Handle", "benholdencrowther", "Ben"),
        text("Avatar URL", "https://www.benholdencrowther.com/wp-content/uploads/2019/03/Hanging_Gardens_of_Babylon.jpg", "Ben"),
      ),
      title: text("Title", 'Curation lead', "Ben"),
      stake: new u128(number("Stake", 10101, {}, "Ben")),
      earned: new u128(number("Earned", 347829, {}, "Ben")),
    },
    {
      memberId: new MemberId(2),
      roleAccount: new GenericAccountId('5DfJWGbBAH8hLAg8rcRYZW5BEZbE4BJeCQKoxUeqoyewLSew'),
      profile: mockProfile(text("Handle", "bwhm0", "Martin")),
      title: text('Title', 'Content curator', 'Martin'),
      stake: new u128(number("Stake", 10101, {}, "Martin")),
      earned: new u128(number("Earned", 347829, {}, "Martin")),
    },
    {
      memberId: new MemberId(3),
      roleAccount: new GenericAccountId('5DQqNWRFPruFs9YKheVMqxUbqoXeMzAWfVfcJgzuia7NA3D3'),
      profile: mockProfile(
        "yourheropaul",
        "https://yhp.io/img/paul.svg",
      ),
      title: text('Title', 'Content curator', 'Paul'),
      stake: new u128(number("Stake", 10101, {}, "Paul")),
      earned: new u128(number("Earned", 347829, {}, "Paul")),
    },
    {
      memberId: new MemberId(4),
      roleAccount: new GenericAccountId('5GSMNn8Sy8k64mGUWPDafjMZu9bQNX26GujbBQ1LeJpNbrfg'),
      profile: mockProfile(
        "alex_joystream",
        "https://avatars2.githubusercontent.com/u/153928?s=200&v=4",
      ),
      title: text('Title', 'Content curator', 'Alex'),
      stake: new u128(number("Stake", 10101, {}, "Alex")),
      earned: new u128(number("Earned", 347829, {}, "Alex")),
    },
    {
      memberId: new MemberId(5),
      roleAccount: new GenericAccountId('5Gn9n7SDJ7VgHqHQWYzkSA4vX6DCmS5TFWdHxikTXp9b4L32'),
      profile: mockProfile(
        "mokhtar",
        "https://avatars2.githubusercontent.com/u/1621012?s=460&v=4",
      ),
      title: text('Title', 'Content curator', 'Mokhtar'),
      stake: new u128(number("Stake", 10101, {}, "Mokhtar")),
      earned: new u128(number("Earned", 347829, {}, "Mokhtar")),
    },
  ]

  return (
    <ContentCurators members={members} rolesAvailable={boolean('Roles available', true)} />
  )
}

export const StorageProvidersSection = () => {
  const balances = new Map<string, Balance>([
    ['5HZ6GtaeyxagLynPryM7ZnmLzoWFePKuDrkb4AT8rT4pU1fp', new u128(101)],
  ])

  const memos = new Map<string, Text>([
    ['5HZ6GtaeyxagLynPryM7ZnmLzoWFePKuDrkb4AT8rT4pU1fp', new Text("This is a memo")]
  ])

  const profiles = new Map<number, IProfile>([
    [1, mockProfile("bwhm0")],
    [2, mockProfile(
      "benholdencrowther",
      "https://www.benholdencrowther.com/wp-content/uploads/2019/03/Hanging_Gardens_of_Babylon.jpg",
    )],
  ])

  const storageProviders: Actor[] = [
    new Actor({ member_id: 1, account: '5HZ6GtaeyxagLynPryM7ZnmLzoWFePKuDrkb4AT8rT4pU1fp' }),
    new Actor({ member_id: 2, account: '5DQqNWRFPruFs9YKheVMqxUbqoXeMzAWfVfcJgzuia7NA3D3' }),
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
