import React from 'react';

import { Container, } from 'semantic-ui-react'
import { Controller, View } from '@polkadot/joy-utils/index'
import { ITransport } from '../transport'
import {
  Applications, OpeningApplication,
  CurrentRoles, ActiveRole, ActiveRoleWithCTAs,
} from './MyRoles'

type State = {
  applications: OpeningApplication[]
  currentCurationRoles: ActiveRoleWithCTAs[]
  myAddress: string
}

const newEmptyState = (): State => {
  return {
    applications: [],
    currentCurationRoles: [],
    myAddress: "",
  }
}

export class MyRolesController extends Controller<State, ITransport> {
  constructor(transport: ITransport, myAddress: string | undefined, initialState: State = newEmptyState()) {
    super(transport, initialState)

    if (typeof myAddress == "string") {
      this.state.myAddress = myAddress
      this.updateCurationGroupRoles(myAddress)
      this.updateApplications(myAddress)
    }
  }

  protected async updateApplications(myAddress: string) {
    this.state.applications = await this.transport.openingApplications(myAddress)
    this.dispatch()
  }

  protected async updateCurationGroupRoles(myAddress: string) {
    const roles = await this.transport.myCurationGroupRoles(myAddress)
    this.state.currentCurationRoles = roles.map(role => ({
      ...role,
      CTAs: [
        {
          title: "Leave role",
          callback: (rationale: string) => { this.leaveCurationRole(role, rationale) },
        }
      ],
    })
    )
    this.dispatch()
  }

  leaveCurationRole(role: ActiveRole, rationale: string) {
    this.transport.leaveCurationRole(this.state.myAddress, role.curatorId.toNumber(), rationale)
  }

  cancelApplication(application: OpeningApplication) {
    this.transport.withdrawCuratorApplication(this.state.myAddress, application.id)
  }
}

export const MyRolesView = View<MyRolesController, State>(
  (state, controller) => (
    <Container className="my-roles">
      <CurrentRoles currentRoles={state.currentCurationRoles} />
      <Applications applications={state.applications} cancelCallback={(a) => controller.cancelApplication(a)} />
    </Container>
  )
)
