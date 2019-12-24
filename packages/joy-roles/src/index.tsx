import React from 'react';

import { AppProps, I18nProps } from '@polkadot/react-components/types';
import { ApiProps } from '@polkadot/react-api/types';
import { SubjectInfo } from '@polkadot/ui-keyring/observable/types';

import { Route, Switch, RouteComponentProps } from 'react-router';
import Tabs, { TabItem } from '@polkadot/react-components/Tabs';
import { withMulti } from '@polkadot/react-api/index';

import { ControllerComponent, ViewComponent } from '@polkadot/joy-utils/index'

import { ITransport } from './transport'
import { Transport } from './transport.polkadot'
import { Transport as MockTransport } from './transport.mock'

import { WorkingGroupsController, } from './tabs/WorkingGroup.controller'
import { OpportunitiesController, OpportunitiesView } from './tabs/Opportunities.controller'
import { ApplyController, ApplyView } from './flows/apply.controller'
import { MyRolesController, MyRolesView } from './tabs/MyRoles.controller'

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
  oppCtrl: OpportunitiesController
  applyCtrl: ApplyController
  myRolesCtrl: MyRolesController

  constructor(props: Props) {
    super(props);

    this.transport = new Transport(props)
    this.mockTransport = new MockTransport()
    this.oppCtrl = new OpportunitiesController(this.mockTransport)
    this.applyCtrl = new ApplyController(this.mockTransport)
    this.myRolesCtrl = new MyRolesController(this.mockTransport)

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
          <Route path={`${basePath}/opportunities`} render={() => this.renderViewComponent(OpportunitiesView(this.oppCtrl))} />
          <Route path={`${basePath}/my-roles`} render={() => this.renderViewComponent(MyRolesView(this.myRolesCtrl))} />
          <Route path={`${basePath}/apply/:id`} render={(props) => this.renderViewComponent(ApplyView(this.applyCtrl), props)} />
          <Route render={() => this.renderComponent(WorkingGroupsController, this.mockTransport)} />
        </Switch>
      </main>
    );
  }

  private renderViewComponent(Component: ViewComponent<any>, props?: RouteComponentProps) {
    let params = new Map<string, string>()
    if (typeof props !== 'undefined' && props.match.params) {
      params = new Map<string, string>(Object.entries(props.match.params))
    }

    return <Component params={params} />
  }

  private renderComponent(Ctrl: ControllerComponent<ITransport>, transport: ITransport, props?: RouteComponentProps) {
    let params = new Map<string, string>()
    if (typeof props !== 'undefined' && props.match.params) {
      params = new Map<string, string>(Object.entries(props.match.params))
    }
    return (
      <Ctrl transport={transport} params={params} />
    )
  }
}

export default withMulti(
  App,
  translate,
);
