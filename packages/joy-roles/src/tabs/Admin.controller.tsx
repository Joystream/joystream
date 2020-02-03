// @ts-nocheck
import React from 'react';
import { Link } from 'react-router-dom';

import { ApiPromise } from '@polkadot/api';
import { GenericAccountId, Option, u32, u64, u128, Set, Text, Vec } from '@polkadot/types'

import { LinkedMapEntry } from '@polkadot/joy-utils/index'
import { MyAccountProvider, useMyAccount } from '@polkadot/joy-utils/MyAccountContext'

import {
  Button,
  Card,
  Checkbox,
  Container,
  Dropdown,
  Grid,
  Label,
  Message,
  Table,
} from 'semantic-ui-react'
import { Controller, View } from '@polkadot/joy-utils/index'
import { ITransport } from '../transport'

import {
  Application,
  ApplicationStage,
  ActivateOpeningAt,
  ApplicationRationingPolicy,
  CurrentBlock,
  Opening,
  OpeningStage,
  StakingPolicy,
  StakingAmountLimitModeKeys,
} from '@joystream/types/hiring'

import {
  MemberId,
} from '@joystream/types/members'

import {
  GenericJoyStreamRoleSchema,
} from '@joystream/types/hiring/schemas/role.schema'

import {
  CuratorApplication, CuratorApplicationId,
  CuratorOpening,
  OpeningPolicyCommitment,
} from '@joystream/types/content-working-group'

import {
  classifyOpeningStage,
	OpeningStageClassification
} from '../classifiers'

import {
	openingDescription,
} from '../openingStateMarkup'

type ids = {
  curatorId: number
  openingId: number
}

type application = ids & {
  account: string,
  memberId: number,
  stage: ApplicationStage,
}

type opening = ids & {
  title: string,
  state: OpeningStage,
  applications: Array<application>,
  classification: OpeningStageClassification, 
}

type State = {
  openings: Map<number, opening>
}

const newEmptyState = (): State => {
  return {
    openings: new Map<number, opening>(),
  }
}

export class AdminController extends Controller<State, ITransport> {
  api: ApiPromise
  constructor(transport: ITransport, api: ApiPromise, initialState: State = newEmptyState()) {
    super(transport, initialState)
    this.api = api
    this.updateState()
  }

  newOpening(creatorAddress: string) {

    const start = new ActivateOpeningAt(CurrentBlock)

    const policy = new OpeningPolicyCommitment({
      max_review_period_length: new u32(99999),
      application_rationing_policy: new Option<ApplicationRationingPolicy>(
        ApplicationRationingPolicy,
        new ApplicationRationingPolicy({
          max_active_applicants: new u32(10),
        }),
      ),
      application_staking_policy: new Option<StakingPolicy>(
        StakingPolicy,
        new StakingPolicy({
          amount: new u128(100),
          amount_mode: StakingAmountLimitModeKeys.AtLeast,
        }),
      ),
    })

    const tx = this.api.tx.contentWorkingGroup.addCuratorOpening(
      start,
      policy,
      new Text(JSON.stringify({
        version: 1,
        headline: "some headline",
        job: {
          title: "some job title",
          description: "some job description",
        },
        application: {
          sections: [
            {
              title: "About you",
              questions: [
                {
                  title: "your name",
                  type: "text"
                }
              ]
            },
            {
              title: "About you",
              questions: [
                {
                  title: "your name",
                  type: "text area"
                }
              ]
            }
          ]
        },
        reward: "10 JOY per block",
        creator: {
          membership: {
            handle: "ben",
          }
        },
        process: {
          details: [
            "Some custom detail"
          ]
        }
      })),
    )

    // Sign and Send the transaction
    tx.signAndSend(creatorAddress, ({ events = [], status }) => {
      if (status.isFinalized) {
        this.updateState()
        console.log('Successful transfer with hash ' + status.asFinalized.toHex());
      } else {
        console.log('Status of transfer: ' + status.type);
      }

      events.forEach(({ phase, event: { data, method, section } }) => {
        console.log(phase.toString() + ' : ' + section + '.' + method + ' ' + data.toString());
      });
    });
  }

  startAcceptingApplications(creatorAddress: string, id: number = 0) {
    const tx = this.api.tx.contentWorkingGroup.acceptCuratorApplications(new u32(id))
    tx.signAndSend(creatorAddress, ({ events = [], status }) => {
      if (status.isFinalized) {
        this.updateState()
        console.log('Successful transfer with hash ' + status.asFinalized.toHex());
      } else {
        console.log('Status of transfer: ' + status.type);
      }

      events.forEach(({ phase, event: { data, method, section } }) => {
        console.log(phase.toString() + ' : ' + section + '.' + method + ' ' + data.toString());
      });
    });
  }

  async applyAsACurator(creatorAddress: string, openingId: number) {
    const membershipIds = (await this.api.query.members.memberIdsByControllerAccountId(creatorAddress)) as Vec<MemberId>
    if (membershipIds.length == 0) {
      console.error("No membship ID associated with this address")
      return
    }
    const tx = this.api.tx.contentWorkingGroup.applyOnCuratorOpening(
      membershipIds[0],
      new u32(openingId),
      new GenericAccountId(creatorAddress),
      new GenericAccountId(creatorAddress),
      new Option(u128, undefined),
      new Option(u128, 100),
      new Text("This is my application"),
    )
    tx.signAndSend(creatorAddress, ({ events = [], status }) => {
      if (status.isFinalized) {
        this.updateState()
        console.log('Successful transfer with hash ' + status.asFinalized.toHex());
      } else {
        console.log('Status of transfer: ' + status.type);
      }

      events.forEach(({ phase, event: { data, method, section } }) => {
        console.log(phase.toString() + ' : ' + section + '.' + method + ' ' + data.toString());
      });
    });
  }

  beginApplicantReview(creatorAddress: string, openingId: number) {
    const tx = this.api.tx.contentWorkingGroup.beginCuratorApplicantReview(
      new u32(openingId),
    )
    tx.signAndSend(creatorAddress, ({ events = [], status }) => {
      if (status.isFinalized) {
        this.updateState()
        console.log('Successful transfer with hash ' + status.asFinalized.toHex());
      } else {
        console.log('Status of transfer: ' + status.type);
      }

      events.forEach(({ phase, event: { data, method, section } }) => {
        console.log(phase.toString() + ' : ' + section + '.' + method + ' ' + data.toString());
      });
    });
  }

  acceptCuratorApplications(creatorAddress: string, openingId: number, applications: Array<number>) {
    const tx = this.api.tx.contentWorkingGroup.fillCuratorOpening(
      new u32(openingId),
      applications,
    )
    tx.signAndSend(creatorAddress, ({ events = [], status }) => {
      if (status.isFinalized) {
        this.updateState()
        console.log('Successful transfer with hash ' + status.asFinalized.toHex());
      } else {
        console.log('Status of transfer: ' + status.type);
      }

      events.forEach(({ phase, event: { data, method, section } }) => {
        console.log(phase.toString() + ' : ' + section + '.' + method + ' ' + data.toString());
      });
    });
  }

  async updateState() {
    this.state.openings = new Map<number, opening>()

    const nextOpeningId = await this.api.query.contentWorkingGroup.nextCuratorOpeningId() as u64
    for (let i = 0; i < nextOpeningId.toNumber(); i++) {
      const curatorOpening = new LinkedMapEntry<CuratorOpening>(
        CuratorOpening,
        await this.api.query.contentWorkingGroup.curatorOpeningById(i),
      )

      const openingId = curatorOpening.value.getField<u32>('opening_id')

      const baseOpening = new LinkedMapEntry<Opening>(
        Opening,
        await this.api.query.hiring.openingById(
          openingId,
        )
      )

      let title: string = "unknown"
      const hrt = baseOpening.value.parse_human_readable_text()
      if (typeof hrt !== 'undefined') {
        title = (hrt as GenericJoyStreamRoleSchema).job.title
      }

      this.state.openings.set(openingId.toNumber(), {
        openingId: openingId.toNumber(),
        curatorId: i,
        applications: new Array<application>(),
        state: baseOpening.value.stage,
        title: title,
        classification: await classifyOpeningStage(this.transport, baseOpening.value),
      })
    }

    const nextAppid = await this.api.query.contentWorkingGroup.nextCuratorApplicationId() as u64
    for (let i = 0; i < nextAppid.toNumber(); i++) {
      const cApplication = new LinkedMapEntry<CuratorApplication>(
        CuratorApplication,
        await this.api.query.contentWorkingGroup.curatorApplicationById(i),
      )

      const appId = cApplication.value.getField<u32>('application_id')
      const baseApplications = new LinkedMapEntry<Application>(
        Application,
        await this.api.query.hiring.applicationById(
          appId,
        )
      )

      const curatorOpening = this.state.openings.get(
        cApplication.value.getField<u32>('curator_opening_id').toNumber(),
      ) as opening

      curatorOpening.applications.push({
        openingId: appId.toNumber(),
        curatorId: cApplication.value.getField<u32>('curator_opening_id').toNumber(),
        stage: baseApplications.value.getField<ApplicationStage>('stage'),
        account: cApplication.value.getField('role_account').toString(),
        memberId: cApplication.value.getField<u32>('member_id').toNumber(),
      })
    }

    this.dispatch()
  }
}

export const AdminView = View<AdminController, State>(
    (state, controller) => {
    const address = useMyAccount().state.address as string
    return (
      <MyAccountProvider>
    <Container className="admin">
      {
        [...state.openings.keys()].map(key => {
          const opening = state.openings.get(key) as opening
          return (
            <Card fluid key={key}>
              <Card.Content>
                <Card.Header>
                  <Label attached="top right">Opening</Label>
                  <Link to={"/roles/opportunities/" + key}>
                    {opening.title}
                  </Link>

                </Card.Header>
                <Card.Meta>
                  Working group module ID #{opening.curatorId}, hiring module ID #{opening.openingId}
                </Card.Meta>
                <Label ribbon>
                  {openingDescription(opening.classification.state)}
                </Label>
                  <Message info> 
                    <Message.Header>Raw state</Message.Header>
                    {JSON.stringify(opening.classification)}
                  </Message>
                <h4>Applications</h4>
                <Table striped>
                  <Table.Header>
                    <Table.Row>
                      <Table.HeaderCell>WG ID</Table.HeaderCell>
                      <Table.HeaderCell>Hiring mod. ID</Table.HeaderCell>
                      <Table.HeaderCell>Account</Table.HeaderCell>
                      <Table.HeaderCell>Member ID</Table.HeaderCell>
                      <Table.HeaderCell>Stage</Table.HeaderCell>
                      <Table.HeaderCell></Table.HeaderCell>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {opening.applications.map((app, id) => (
                      <Table.Row key={app.openingId}>
                        <Table.Cell>{id}</Table.Cell>
                        <Table.Cell>{app.openingId}</Table.Cell>
                        <Table.Cell>{app.account}</Table.Cell>
                        <Table.Cell>{app.memberId}</Table.Cell>
                        <Table.Cell>{JSON.stringify(app.stage)}</Table.Cell>
                        <Table.Cell><Checkbox /></Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table>
              </Card.Content>
              <Card.Content extra>
                <Grid>
                  <Grid.Row columns={2}>
                    <Grid.Column>
                      <Dropdown text='Set stage'>
                        <Dropdown.Menu>
                          <Dropdown.Item
                            text='Start accepting applications'
                            onClick={() => { controller.startAcceptingApplications(address, key) }}
                          />
                          <Dropdown.Item
                            text='Begin applicant review'
                            onClick={() => { controller.beginApplicantReview(address, key) }}
                          />
                        </Dropdown.Menu>
                      </Dropdown>

                    </Grid.Column>
                    <Grid.Column align="right">
                      <Button onClick={() => { controller.applyAsACurator(address, key) }}>Apply as curator</Button>
                      <Button onClick={() => { controller.acceptCuratorApplications(address, key, [0, 1, 2, 3]) }}>Accept curator applications</Button>
                    </Grid.Column>
                  </Grid.Row>
                </Grid>
              </Card.Content>
            </Card>
          )
        }
        )
      }
      <p align="right">
        <Button positive onClick={() => { controller.newOpening(address) }}>Create new curator group opening</Button>
      </p>
    </Container>
      </MyAccountProvider>
  )
    }
)
