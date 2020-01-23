// @ts-nocheck
import React from 'react';
import { Link } from 'react-router-dom';

import { ApiPromise } from '@polkadot/api';
import { GenericAccountId, Option, u32, u64, u128, Text, Vec } from '@polkadot/types'

import { LinkedMapEntry } from '@polkadot/joy-utils/index'

import {
  Button,
  Card,
  Checkbox,
  Container,
  Dropdown, 
  Grid,
  Label,
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
  OpeningStage
} from '@joystream/types/hiring'
import {
  GenericJoyStreamRoleSchema,
} from '@joystream/types/hiring/schemas/role.schema'
import {
  CuratorApplication,
  CuratorOpening,
  OpeningPolicyCommitment,
} from '@joystream/types/content-working-group'

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
}

type State = {
  openings: Map<number, opening>
}

const newEmptyState = (): State => {
  return {
    openings: new Map<number, opening>(),
  }
}

const ALICE = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';

export class AdminController extends Controller<State, ITransport> {
  api: ApiPromise
  constructor(transport: ITransport, api: ApiPromise, initialState: State = newEmptyState()) {
    super(transport, initialState)
    this.api = api
    this.updateState()
  }

  // FIXME! This should be in the transport
  newOpening() {

    const start = new ActivateOpeningAt(CurrentBlock)

    const policy = new OpeningPolicyCommitment({
      max_review_period_length: new u32(99999),
      application_rationing_policy: new Option<ApplicationRationingPolicy>(
        ApplicationRationingPolicy,
        new ApplicationRationingPolicy({
          max_active_applicants: new u32(10),
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
    tx.signAndSend(ALICE, ({ events = [], status }) => {
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

  startAcceptingApplications(id: number = 0) {
    const tx = this.api.tx.contentWorkingGroup.acceptCuratorApplications(new u32(id))
    tx.signAndSend(ALICE, ({ events = [], status }) => {
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

  applyAsACurator(openingId: number, memberId: number, account: string = ALICE) {
    const tx = this.api.tx.contentWorkingGroup.applyOnCuratorOpening(
      new u64(memberId),
      new u32(openingId),
      new GenericAccountId(account),
      new GenericAccountId(account),
      new Option(u128, undefined),
      new Option(u128, undefined),
      new Text("This is my application"),
    )
    tx.signAndSend(ALICE, ({ events = [], status }) => {
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

  beginApplicantReview(openingId: number) {
    const tx = this.api.tx.contentWorkingGroup.beginCuratorApplicantReview(
      new u32(openingId),
    )
    tx.signAndSend(ALICE, ({ events = [], status }) => {
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

  acceptCuratorApplications(openingId: number, applications: Array<number>) {
    const tx = this.api.tx.contentWorkingGroup.fillCuratorOpening(
      new u32(openingId),
      new Vec(u64, applications),
    )
    tx.signAndSend(ALICE, ({ events = [], status }) => {
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
  (state, controller) => (
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
                  {JSON.stringify(opening.state)}
                </Label>
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
        onClick={() => { controller.startAcceptingApplications(key) }}
      />
      <Dropdown.Item 
        text='Begin applicant review' 
        onClick={() => { controller.beginApplicantReview(key) }}
      />
      </Dropdown.Menu>
  </Dropdown>

  </Grid.Column>
<Grid.Column align="right">
                <Button onClick={() => { controller.applyAsACurator(key, 0) }}>Apply as curator</Button>
                <Button onClick={() => { controller.acceptCuratorApplications(key, [0]) }}>Accept curator applications</Button>
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
        <Button positive onClick={() => { controller.newOpening() }}>Create new curator group opening</Button>
      </p>
    </Container>
  )
)
