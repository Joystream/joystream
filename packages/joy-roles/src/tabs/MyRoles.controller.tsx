import React from 'react';

import { Container, } from 'semantic-ui-react'
import { Controller, View } from '@polkadot/joy-utils/index'
import { ITransport } from '../transport'
import { Opening } from "@joystream/types/hiring"
import {
  Applications, OpeningApplication,
  CurrentRoles, ActiveRole, ActiveRoleWithCTAs,
} from './MyRoles'

type State = {
  applications: OpeningApplication[]
  currentCurationRoles: ActiveRoleWithCTAs[]
  currentStorageRoles: ActiveRoleWithCTAs[]
}

const newEmptyState = (): State => {
  return {
    applications: [],
    currentCurationRoles: [],
    currentStorageRoles: [],
  }
}

export class MyRolesController extends Controller<State, ITransport> {
  constructor(transport: ITransport, initialState: State = newEmptyState()) {
    super(transport, initialState)

    this.transport.openingApplications().subscribe(
      apps => this.updateApplications(apps)
    )

    this.transport.myCurationGroupRoles().subscribe(
      roles => this.updateCurationGroupRoles(roles)
    )

    this.transport.myStorageGroupRoles().subscribe(
      roles => this.updateStorageGroupRoles(roles)
    )
  }

  protected updateApplications(apps: OpeningApplication[]) {
    this.state.applications = apps
    this.dispatch()
  }

  protected updateCurationGroupRoles(roles: ActiveRole[]) {
    const newRoles: ActiveRoleWithCTAs[] = []

    roles.forEach(
      role => newRoles.push({
        ...role,
        CTAs: [
          {
            title: "Leave role",
            callback: () => { this.leaveCurationRole(role) },
          }
        ],
      })
    )

    this.state.currentCurationRoles = newRoles
    this.dispatch()
  }

  protected updateStorageGroupRoles(roles: ActiveRole[]) {
    const newRoles: ActiveRoleWithCTAs[] = []

    roles.forEach(
      role => newRoles.push({
        ...role,
        CTAs: [
          {
            title: "Unstake",
            callback: () => { this.leaveStorageRole(role) },
          }
        ],
      })
    )

    this.state.currentStorageRoles = newRoles
    this.dispatch()
  }

  leaveCurationRole(role: ActiveRole) {
    // TODO
  }

  leaveStorageRole(role: ActiveRole) {
    // TODO
  }

  cancelApplication(opening: Opening) {
    // TODO
  }
}

export const MyRolesView = View<MyRolesController, State>(
  (state, controller) => (
    <Container className="my-roles">
      <CurrentRoles currentRoles={state.currentCurationRoles.concat(state.currentStorageRoles)} />
      <Applications applications={state.applications} cancelCallback={controller.cancelApplication} />
    </Container>
  )
)
