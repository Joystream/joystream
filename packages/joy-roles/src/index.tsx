import React, {useContext} from 'react';

import { ApiContext } from '@polkadot/react-api';
import { AppProps, I18nProps } from '@polkadot/react-components/types';
import { ApiProps } from '@polkadot/react-api/types';
import { SubjectInfo } from '@polkadot/ui-keyring/observable/types';

import { Route, Switch, RouteComponentProps } from 'react-router';
import Tabs from '@polkadot/react-components/Tabs';
import { withMulti } from '@polkadot/react-api/index';

import { ViewComponent } from '@polkadot/joy-utils/index'

import { Transport } from './transport.polkadot'
import { Transport as MockTransport } from './transport.mock'

import { WorkingGroupsController, WorkingGroupsView } from './tabs/WorkingGroup.controller'
import { OpportunityController, OpportunityView } from './tabs/Opportunity.controller'
import { OpportunitiesController, OpportunitiesView } from './tabs/Opportunities.controller'
import { ApplyController, ApplyView } from './flows/apply.controller'
import { MyRolesController, MyRolesView } from './tabs/MyRoles.controller'
import { AdminController, AdminView } from './tabs/Admin.controller'

import './index.sass';

import translate from './translate';

type Props = AppProps & ApiProps & I18nProps & {
  allAccounts?: SubjectInfo,
};

export const App: React.FC<Props> = (props: Props) => {
  const { t } = props
  const tabs = [
    {
      isRoot: true,
      name: 'working-groups',
      text: t('Working groups')
    },
    {
      name: 'opportunities',
      text: t('Opportunities'),
      hasParams: true,
    },
    {
      name: 'my-roles',
      text: t('My roles')
    },
   ]


  const { api } = useContext(ApiContext);
  const transport = new Transport(api)
  const mockTransport = new MockTransport()

  const wgCtrl = new WorkingGroupsController(mockTransport)
  const oppCtrl = new OpportunityController(transport)
  const oppsCtrl = new OpportunitiesController(mockTransport)
  const applyCtrl = new ApplyController(mockTransport)
  const myRolesCtrl = new MyRolesController(mockTransport)
  const adminCtrl = new AdminController(transport, api)

   // FIXME! Move to transport
  const { basePath } = props
  return (
    <main className='actors--App'>
      <header>
        <Tabs
          basePath={basePath}
          items={tabs}
        />
      </header>
      <Switch>
        <Route path={`${basePath}/opportunities/:id`} render={(props) => renderViewComponent(OpportunityView(oppCtrl), props)} />
        <Route path={`${basePath}/opportunities`} render={() => renderViewComponent(OpportunitiesView(oppsCtrl))} />
        <Route path={`${basePath}/my-roles`} render={() => renderViewComponent(MyRolesView(myRolesCtrl))} />
        <Route path={`${basePath}/apply/:id`} render={(props) => renderViewComponent(ApplyView(applyCtrl), props)} />
        <Route path={`${basePath}/admin`} render={() => renderViewComponent(AdminView(adminCtrl))} />
        <Route render={() => renderViewComponent(WorkingGroupsView(wgCtrl))} />
      </Switch>
    </main>
  )
}

const renderViewComponent = (Component: ViewComponent<any>, props?: RouteComponentProps) => {
  let params = new Map<string, string>()
  if (props && props.match.params) {
    params = new Map<string, string>(Object.entries(props.match.params))
  }

  return <Component params={params} />
}

export default withMulti(
  App,
  translate,
);
