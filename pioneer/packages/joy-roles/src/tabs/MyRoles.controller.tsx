import React from 'react';

import { Container } from 'semantic-ui-react';
import { Controller } from '@polkadot/joy-utils/react/helpers';
import { View } from '@polkadot/joy-utils/react/hocs';
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
  constructor (transport: ITransport, initialState: State = newEmptyState()) {
    super(transport, initialState);
  }

  refreshState() {
    if (!this.state.myAddress) {
      return;
    }
    // Set actual data
    this.updateCurationGroupRoles(this.state.myAddress);
    this.updateApplications(this.state.myAddress);
  }

  setMyAddress (myAddress: string | undefined) {
    if (typeof myAddress === 'string') {
      this.state.myAddress = myAddress;
      this.refreshState();
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
    const successCb = this.refreshState.bind(this);
    this.transport.leaveRole(role.group, this.state.myAddress, role.workerId.toNumber(), rationale, successCb);
  }

  cancelApplication (application: OpeningApplication) {
    const successCb = this.refreshState.bind(this);
    this.transport.withdrawApplication(application.meta.group, this.state.myAddress, application.id, successCb);
  }
}

export const MyRolesView = View<MyRolesController, State>(
  ({ state, controller }) => (
    <Container className="my-roles">
      <CurrentRoles currentRoles={state.currentRoles} />
      <Applications applications={state.applications} cancelCallback={(a) => controller.cancelApplication(a)} />
    </Container>
  )
);
