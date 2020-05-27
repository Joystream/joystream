// @ts-nocheck
import React from 'react'
import { boolean, number, text, withKnobs } from '@storybook/addon-knobs'
import { Table } from 'semantic-ui-react';

import { u128, Text } from '@polkadot/types'

import { Actor } from '@joystream/types/roles'

import { BalanceView, GroupMemberView, HandleView, MemberView, MemoView } from './elements'

import 'semantic-ui-css/semantic.min.css'
import '@polkadot/joy-roles/index.sass'

export default {
  title: 'Roles / Elements',
  decorators: [withKnobs],
}

export const Balance = () => {
  return (
    <BalanceView balance={new u128(number('Balance', 10))} />
  )
}

export const Memo = () => {
  const actor = new Actor({ member_id: 1, account: '5HZ6GtaeyxagLynPryM7ZnmLzoWFePKuDrkb4AT8rT4pU1fp' })
  const memo = new Text(text("Memo text", "This is a memo"))

  return (
    <MemoView actor={actor} memo={memo} />
  )
}

export const Handle = () => {
  const profile = {
    handle: new Text(text("Handle", "benholdencrowther")),
  }

  return (
    <HandleView profile={profile} />
  )
}

export const Member = () => {
  const actor = new Actor({ member_id: 1, account: '5HZ6GtaeyxagLynPryM7ZnmLzoWFePKuDrkb4AT8rT4pU1fp' })
  const profile = {
    handle: new Text(text("Handle", "benholdencrowther")),
  }

  return (
    <Table basic='very'>
      <Table.Body>
        <Table.Row>
          <Table.Cell>
            <MemberView
              actor={actor}
              balance={new u128(number('Balance', 10))}
              profile={profile}
            />
          </Table.Cell>
        </Table.Row>
      </Table.Body>
    </Table>
  )
}

export const GroupMember = () => {
  const actor = new Actor({ member_id: 1, account: '5HZ6GtaeyxagLynPryM7ZnmLzoWFePKuDrkb4AT8rT4pU1fp' })
  const profile = {
    handle: new Text(text("Handle", "benholdencrowther")),
  }

  return (
    <GroupMemberView
      actor={actor}
      profile={profile}
      title={text('Title', 'Group lead')}
      lead={boolean('Lead member', true)}
      stake={new u128(number('Stake', 10))}
      earned={new u128(number('Earned', 10))}
    />
  )
}

