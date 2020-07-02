import React from 'react';

import { Container } from 'semantic-ui-react';
import { Controller, View } from '@polkadot/joy-utils/index';
import { ITransport } from '../transport';
import {
  Applications, OpeningApplication,
  CurrentRoles, ActiveRole, ActiveRoleWithCTAs
} from './MyRoles';

type State = {
  applications: OpeningApplication[];
  currentRoles: ActiveRoleWithCTAs[];
  myAddress: string;
}

const newEmptyState = (): State => {
  return {
    applications: [],
    currentRoles: [],
    myAddress: ''
  };
};

export class MyRolesController extends Controller<State, ITransport> {
  constructor (transport: ITransport, myAddress: string | undefined, initialState: State = newEmptyState()) {
    super(transport, initialState);

    if (typeof myAddress === 'string') {
      this.state.myAddress = myAddress;
      this.updateCurationGroupRoles(myAddress);
      this.updateApplications(myAddress);
    }
  }

  protected async updateApplications (myAddress: string) {
    this.state.applications = await this.transport.openingApplicationsByAddress(myAddress);
    this.dispatch();
  }

  protected async updateCurationGroupRoles (myAddress: string) {
    const roles = await this.transport.myRoles(myAddress);
    this.state.currentRoles = roles.map(role => ({
      ...role,
      CTAs: [
        {
          title: 'Leave role',
          callback: (rationale: string) => { this.leaveRole(role, rationale); }
        }
      ]
    })
    );
    this.dispatch();
  }

  leaveRole (role: ActiveRole, rationale: string) {
    this.transport.leaveRole(role.group, this.state.myAddress, role.workerId.toNumber(), rationale);
  }

  cancelApplication (application: OpeningApplication) {
    this.transport.withdrawApplication(application.meta.group, this.state.myAddress, application.id);
  }
}

export const MyRolesView = View<MyRolesController, State>(
  (state, controller) => (
    <Container className="my-roles">
      <CurrentRoles currentRoles={state.currentRoles} />
      <Applications applications={state.applications} cancelCallback={(a) => controller.cancelApplication(a)} />
    </Container>
  )
);
