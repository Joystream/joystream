import React from 'react'
import { Button, Card, Message, Table } from 'semantic-ui-react';

import { Balance } from '@polkadot/types/interfaces';
import { Actor } from '@joystream/types/roles';
import { Profile } from '@joystream/types/members';
import { Text } from '@polkadot/types';

import { ActorDetailsView, GroupMemberProps, MemberView, GroupMemberView } from "../elements"

type WorkingGroupProps = {
  members: GroupMemberProps[]
  rolesAvailable: boolean
}

export function ContentCurators(props: WorkingGroupProps) {
  let message = (
    <Message>
      <Message.Header>No open roles at the moment</Message.Header>
      <p>The team is full at the moment, but we intend to expand. Check back for open roles soon!</p>
    </Message>
  )

  if (props.rolesAvailable) {
    message = (
      <Message positive>
        <Message.Header>Join us and get paid to curate!</Message.Header>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
				</p>
        <Button positive>Find out more &raquo;</Button>
      </Message>
    )
  }

  return (
    <section id="content-curators">
      <h2>Content curators</h2>
      <p>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
		</p>
      <Card.Group>
        {props.members.map((member, key) => (
          <GroupMemberView {...member} />
        ))}
      </Card.Group>
      {message}
    </section>
  )
}

type StorageAndDistributionProps = {
  actors: Actor[]
  balances: Map<string, Balance>
  memos: Map<string, Text>
  profiles: Map<number, Profile>
}

export function StorageAndDistribution(props: StorageAndDistributionProps) {
  return (
    <section id="storage-providers">
      <h2>Storage and distribution</h2>
      <Table basic='very'>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Member</Table.HeaderCell>
            <Table.HeaderCell>Details</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {props.actors.map((actor, key) => (
            <Table.Row key={key}>
              <Table.Cell>
                <MemberView
                  actor={actor}
                  balance={props.balances.get(actor.account.toString())}
                  profile={props.profiles.get(actor.member_id.toNumber())}
                />
              </Table.Cell>
              <Table.Cell>
                <ActorDetailsView
                  actor={actor}
                  balance={props.balances.get(actor.account.toString())}
                  memo={props.memos.get(actor.account.toString())}
                />
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </section>
  )
}
