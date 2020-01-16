import React from 'react';

import { ApiPromise } from '@polkadot/api';
import { Text } from '@polkadot/types'

import { Button, Container } from 'semantic-ui-react'
import { Controller, View } from '@polkadot/joy-utils/index'
import { ITransport } from '../transport'

import { ActivateOpeningAt, CurrentBlock } from '@joystream/types/hiring'
import { OpeningPolicyCommitment } from '@joystream/types/content-working-group'

type State = {
}

export class AdminController extends Controller<State, ITransport> {
  api: ApiPromise
  constructor(transport: ITransport, api: ApiPromise, initialState: State = {}) {
    super(transport, initialState)
    this.api = api
  }

  // FIXME! This should be in the transport
  newOpening() {
    const ALICE = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';

    const start =  new ActivateOpeningAt(CurrentBlock)

    const policy = new OpeningPolicyCommitment(
    )

    const transfer = this.api.tx.contentWorkingGroup.addCuratorOpening(
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
    transfer.signAndSend(ALICE, ({ events = [], status }) => {
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
}

export const AdminView = View<AdminController, State>(
  (state, controller) => (
    <Container className="admin">
      <Button onClick={() => {controller.newOpening()}}>Create new opening</Button>
    </Container>
  )
)
