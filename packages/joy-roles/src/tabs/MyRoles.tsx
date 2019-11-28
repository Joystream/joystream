import React from 'react'
import { Link } from 'react-router-dom';
import {
  Button,
  Container,
  Icon,
  Grid,
  Label,
  List,
  Message,
  Segment,
  Statistic,
  Table,
} from 'semantic-ui-react'

import { formatBalance } from '@polkadot/util';
import { Balance } from '@polkadot/types/interfaces';

import { GroupMemberProps, GroupMemberView } from '../elements'

type CTACallback = () => void

type CTA = {
  title: string
  callback: CTACallback
}

function CTAButton(props: CTA) {
  return (
    <Button negative icon labelPosition='left' onClick={props.callback}>
      <Icon name='warning sign' />
      {props.title}
    </Button>
  )
}

interface nameAndURL {
  name: string
  url?: string
}

function RoleName(props: nameAndURL) {
  if (typeof props.url !== 'undefined') {
    return <Link to={props.url}>{props.name}</Link>
  }
  return <span>{props.name}</span>
}

interface currentRole extends nameAndURL {
  reward: string
  stake: Balance
  CTAs: CTA[]
}

export type CurrentRolesProps = {
  currentRoles: currentRole[]
}

export function CurrentRoles(props: CurrentRolesProps) {
  return (
    <Container className="current-roles">
      <h3>Current roles</h3>
      <Table basic='very'>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Role</Table.HeaderCell>
            <Table.HeaderCell>Reward</Table.HeaderCell>
            <Table.HeaderCell>Stake</Table.HeaderCell>
            <Table.HeaderCell></Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {props.currentRoles.map((role, key) => (
            <Table.Row key={key}>
              <Table.Cell>
                <RoleName name={role.name} url={role.url} />
              </Table.Cell>
              <Table.Cell>
                {role.reward}
              </Table.Cell>
              <Table.Cell>
                {formatBalance(role.stake)}
              </Table.Cell>
              <Table.Cell>
                {role.CTAs.map((cta, key2) => (
                  <CTAButton {...cta} key={key2} />
                ))}
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </Container>
  )
}

export type ApplicationProps = {
  creator: GroupMemberProps
}

export function Application(props: ApplicationProps) {
  return (
    <Segment className="application">
      <Label attached='top' color='green'>
        Content curator
        <Label.Detail className="right">
          <Icon name='heart' />
          Still accepting applications
        </Label.Detail>
      </Label>
      <Grid columns="equal">
        <Grid.Column width={10} className="summary">
          <Label ribbon>
            <Statistic size='tiny'>
              <Statistic.Label>Reward</Statistic.Label>
              <Statistic.Value>150 million JOY per block</Statistic.Value>
            </Statistic>
          </Label>
          <div className="summary">
            <p>Summary of the role: help us promote awesome content</p>
          </div>
          <Table basic='very'>
            <Table.Body>
              <Table.Row>
                <Table.Cell>
                  stake
              </Table.Cell>
                <Table.Cell>
                  value
              </Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.Cell>
                  stake
              </Table.Cell>
                <Table.Cell>
                  value
              </Table.Cell>
              </Table.Row>
            </Table.Body>
          </Table>
          <h4>Hiring process details</h4>
          <List bulleted>
            <List.Item>Gaining Access</List.Item>
            <List.Item>Inviting Friends</List.Item>
          </List>

        </Grid.Column>
        <Grid.Column width={6} className="details">
          <Message positive>
            <Message.Header>
              <Icon name='check circle' />
              Your rank: 15/20
          </Message.Header>
            <p>
              When the review period begins, you will be considered for this role.
            </p>
          </Message>
          <h4>Group lead</h4>
          <GroupMemberView {...props.creator} inset={true} />
          <Button fluid icon labelPosition='left' negative>
            <Icon name='warning sign' />
            Cancel and withdraw stake
           </Button>
        </Grid.Column>
      </Grid>
    </Segment>
  )
}

export type ApplicationsProps = {
}

export function Applications(props: ApplicationsProps) {
  return (
    <Container className="current-roles">
      <h3>Applications</h3>
    </Container>
  )
}
