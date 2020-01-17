import React from 'react';

import { ApiPromise } from '@polkadot/api';
import { GenericAccountId, Option, u32, u64, u128, Text, Vec } from '@polkadot/types'

import { LinkedMapEntry } from '@polkadot/joy-utils/index'

import { Button, Container } from 'semantic-ui-react'
import { Controller, View } from '@polkadot/joy-utils/index'
import { ITransport } from '../transport'

import { ActivateOpeningAt, ApplicationRationingPolicy, CurrentBlock } from '@joystream/types/hiring'
import { MemberId } from '@joystream/types/members'
import { CuratorOpening, OpeningPolicyCommitment } from '@joystream/types/content-working-group'

type State = {
}

const ALICE = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';

export class AdminController extends Controller<State, ITransport> {
  api: ApiPromise
  constructor(transport: ITransport, api: ApiPromise, initialState: State = {}) {
    super(transport, initialState)
    this.api = api
  }

  // FIXME! This should be in the transport
  newOpening() {

    const start =  new ActivateOpeningAt(CurrentBlock)

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
        console.log('Successful transfer with hash ' + status.asFinalized.toHex());
      } else {
        console.log('Status of transfer: ' + status.type);
      }

      events.forEach(({ phase, event: { data, method, section } }) => {
        console.log(phase.toString() + ' : ' + section + '.' + method + ' ' + data.toString());
      });
    });
  }

  async dumpStatus() {
    const nextOpeningId = await this.api.query.contentWorkingGroup.nextCuratorOpeningId() as u64
    for (let i = 0; i < nextOpeningId.toNumber(); i++) {
      const curatorOpening = new LinkedMapEntry<CuratorOpening>(
        CuratorOpening, 
        await this.api.query.contentWorkingGroup.curatorOpeningById(i),
      )
      console.log("curator opening " + i, curatorOpening.toJSON())
      console.log("opening " + i, (await this.api.query.hiring.openingById(
        curatorOpening.value.getField<u32>('opening_id'))).toJSON(),
      )
    }

	  const nextAppid = await this.api.query.contentWorkingGroup.nextCuratorApplicationId() as u64
	  for (let i = 0; i < nextAppid.toNumber(); i++) {
		  console.log("app " + i, (await this.api.query.contentWorkingGroup.curatorApplicationById(i)).toJSON())
	  }
  }
}

export const AdminView = View<AdminController, State>(
  (state, controller) => (
    <Container className="admin">
		<p>
      <Button onClick={() => {controller.newOpening()}}>Create new curator group opening</Button>
		  </p>
			<p>
      <Button onClick={() => {controller.startAcceptingApplications(0)}}>Start accepting applications</Button>
		  </p>
			<p>
      <Button onClick={() => {controller.applyAsACurator(0, 0)}}>Apply as curator</Button>
		  </p>
			<p>
      <Button onClick={() => {controller.beginApplicantReview(0)}}>Begin applicant review</Button>
		  </p>
			<p>
      <Button onClick={() => {controller.acceptCuratorApplications(0, [0])}}>Accept curator applications</Button>
		  </p>
			<p>
      <Button negative onClick={() => {controller.dumpStatus()}}>Dump status</Button>
		  </p>
    </Container>
  )
)
