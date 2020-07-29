import React, { useContext, useEffect, useState } from 'react';

import { ApiContext } from '@polkadot/react-api';
import { AppProps, I18nProps } from '@polkadot/react-components/types';
import { ApiProps } from '@polkadot/react-api/types';

import { Route, Switch, RouteComponentProps } from 'react-router';
import Tabs from '@polkadot/react-components/Tabs';
import { withMulti } from '@polkadot/react-api/index';
import QueueContext from '@polkadot/react-components/Status/Context';
import { withMyAccount, MyAccountProps } from '@polkadot/joy-utils/MyAccount';

import { ViewComponent } from '@polkadot/joy-utils/index';

import { Transport } from './transport.substrate';

import { WorkingGroupsController, WorkingGroupsView } from './tabs/WorkingGroup.controller';
import { OpportunityController, OpportunityView } from './tabs/Opportunity.controller';
import { OpportunitiesController, OpportunitiesView } from './tabs/Opportunities.controller';
import { ApplyController, ApplyView } from './flows/apply.controller';
import { MyRolesController, MyRolesView } from './tabs/MyRoles.controller';
import { AdminController, AdminView } from './tabs/Admin.controller';

import './index.sass';

import translate from './translate';

const renderViewComponent = (Component: ViewComponent<any>, props?: RouteComponentProps) => {
  let params = new Map<string, string>();
  if (props && props.match.params) {
    params = new Map<string, string>(Object.entries(props.match.params));
  }

  return <Component params={params} />;
};

type Props = AppProps & ApiProps & I18nProps & MyAccountProps

export const App: React.FC<Props> = (props: Props) => {
  const { t } = props;
  const tabs: Array<any> = [
    {
      isRoot: true,
      name: 'working-groups',
      text: t('Working groups')
    },
    {
      name: 'opportunities',
      text: t('Opportunities'),
      hasParams: true
    }
  ];

  const { api } = useContext(ApiContext);
  const { queueExtrinsic } = useContext(QueueContext);
  const transport = new Transport(api, queueExtrinsic);

  const [wgCtrl] = useState(new WorkingGroupsController(transport));
  const oppCtrl = new OpportunityController(transport, props.myMemberId);
  const oppsCtrl = new OpportunitiesController(transport, props.myMemberId);
  const [applyCtrl] = useState(new ApplyController(transport));
  const myRolesCtrl = new MyRolesController(transport, props.myAddress);
  const [adminCtrl] = useState(new AdminController(transport, api, queueExtrinsic));

  useEffect(() => {
    return () => {
      transport.unsubscribe();
    };
  });

  const { basePath } = props;

  if (props.myAddress) {
    tabs.push({
      name: 'my-roles',
      text: t('My roles and applications')
    });
  }

  return (
    <main className='roles--App'>
      <header>
        <Tabs
          basePath={basePath}
          items={tabs}
        />
      </header>
      <Switch>
        <Route path={`${basePath}/opportunities/:group/:id([0-9]+)/apply`} render={(props) => renderViewComponent(ApplyView(applyCtrl), props)} />
        <Route path={`${basePath}/opportunities/:group/:id([0-9]+)`} render={(props) => renderViewComponent(OpportunityView(oppCtrl), props)} />
        <Route path={`${basePath}/opportunities/:group/:lead(lead)?`} render={(props) => renderViewComponent(OpportunitiesView(oppsCtrl), props)} />
        <Route path={`${basePath}/opportunities`} render={() => renderViewComponent(OpportunitiesView(oppsCtrl))} />
        <Route path={`${basePath}/my-roles`} render={() => renderViewComponent(MyRolesView(myRolesCtrl))} />
        <Route path={`${basePath}/admin`} render={() => renderViewComponent(AdminView(adminCtrl))} />
        <Route render={() => renderViewComponent(WorkingGroupsView(wgCtrl))} />
      </Switch>
    </main>
  );
};

export default withMulti(
  App,
  translate,
  withMyAccount
);
