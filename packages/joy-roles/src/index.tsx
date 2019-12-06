import React from 'react';

import { AppProps, I18nProps } from '@polkadot/react-components/types';
import { ApiProps } from '@polkadot/react-api/types';
import { SubjectInfo } from '@polkadot/ui-keyring/observable/types';

import { Route, Switch } from 'react-router';
import Tabs, { TabItem } from '@polkadot/react-components/Tabs';
import accountObservable from '@polkadot/ui-keyring/observable/accounts';
import { withCalls, withMulti, withObservable } from '@polkadot/react-api/index';

import { ControllerComponent } from '@polkadot/joy-utils/index'

import { ITransport } from './transport'
import { Transport } from './transport.polkadot'
import { Transport as MockTransport} from './transport.mock'

import { WorkingGroupsController, } from './tabs/WorkingGroup.controller'
import { OpportunitiesController } from './tabs/Opportunities.controller'

import './index.sass';

import translate from './translate';

type Props = AppProps & ApiProps & I18nProps & {
  allAccounts?: SubjectInfo,
};

type State = {
  tabs: Array<TabItem>,
};

class App extends React.PureComponent<Props, State> {
  state: State;
  transport: ITransport
  mockTransport: ITransport

  constructor(props: Props) {
    super(props);

    this.transport = new Transport(props)
    this.mockTransport = new MockTransport()

    const { t } = props;

    this.state = {
      tabs: [
        {
          isRoot: true,
          name: 'working-groups',
          text: t('Working groups')
        },
        {
          name: 'opportunities',
          text: t('Opportunities')
        },
        {
          name: 'my-roles',
          text: t('My roles')
        },
      ],
    };
  }

  render() {
    const { allAccounts } = this.props;
    const { tabs } = this.state;
    const { basePath } = this.props;
    const hasAccounts = allAccounts && Object.keys(allAccounts).length;
    const filteredTabs = hasAccounts
      ? tabs
      : tabs.filter(({ name }) =>
        !['requests'].includes(name)
      );

    return (
      <main className='actors--App'>
        <header>
          <Tabs
            basePath={basePath}
            items={filteredTabs}
          />
        </header>
        <Switch>
          <Route path={`${basePath}/opportunities`} render={this.renderComponent(OpportunitiesController, this.mockTransport)} />
          <Route path={`${basePath}/my-roles`} render={this.renderComponent(WorkingGroupsController, this.mockTransport)} />
          <Route render={this.renderComponent(WorkingGroupsController, this.mockTransport)} />
        </Switch>
      </main>
    );
  }

  private renderComponent(Ctrl: ControllerComponent<ITransport>, transport: ITransport) {
    return (): React.ReactNode => {
      return (
        <Ctrl transport={transport} />
      )
    };
  }

}

export default withMulti(
  App,
  translate,
  withObservable(accountObservable.subject, { propName: 'allAccounts' }),
  withCalls<Props>(
    ['query.actors.actorAccountIds', { propName: 'actorAccountIds' }],
    ['query.actors.roleEntryRequests', { propName: 'requests' }],
    ['query.actors.availableRoles', { propName: 'roles' }],
  )
);
