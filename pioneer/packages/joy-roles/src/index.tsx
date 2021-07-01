import React, { useContext, useEffect, useState } from 'react';
import styled from 'styled-components';

import { ApiContext } from '@polkadot/react-api';
import { AppProps, I18nProps } from '@polkadot/react-components/types';
import { ApiProps } from '@polkadot/react-api/types';

import { Route, Switch, RouteComponentProps } from 'react-router';
import Tabs from '@polkadot/react-components/Tabs';
import { withMulti } from '@polkadot/react-api/index';
import QueueContext from '@polkadot/react-components/Status/Context';
import { withMyAccount, MyAccountProps } from '@polkadot/joy-utils/react/hocs/accounts';

import { Transport } from './transport.substrate';

import { WorkingGroupsController, WorkingGroupsView } from './tabs/WorkingGroup.controller';
import { OpportunityController, OpportunityView } from './tabs/Opportunity.controller';
import { OpportunitiesController, OpportunitiesView } from './tabs/Opportunities.controller';
import { ApplyController, ApplyView } from './flows/apply.controller';
import { MyRolesController, MyRolesView } from './tabs/MyRoles.controller';

import './index.sass';

import translate from './translate';

const Banner = styled.div`
  height: 150px;
  display: flex;
  justify-content: center;
  margin: 0 -2em;
  align-items: center;
  border-bottom: 1px solid #ddd;
`;

const BannerText = styled.h1`
  font-size: 24px;
  color: black;
  width: 75%;
  text-align: center;
  font-weight: 600;

  @media(max-width: 1300px){
    font-size: 20px;
    width: 90%;
  }
`;

type Props = AppProps & ApiProps & I18nProps & MyAccountProps

type DefaultRouteProps = RouteComponentProps<Record<string, string | undefined>>;

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
  const [transport] = useState(() => new Transport(api, queueExtrinsic));

  const [wgCtrl] = useState(() => new WorkingGroupsController(transport));
  const [oppCtrl] = useState(() => new OpportunityController(transport));
  const [oppsCtrl] = useState(() => new OpportunitiesController(transport));
  const [applyCtrl] = useState(() => new ApplyController(transport));
  const [myRolesCtrl] = useState(() => new MyRolesController(transport));

  useEffect(() => {
    return () => {
      transport.unsubscribe();
    };
  }, []);

  useEffect(() => {
    oppCtrl.setMemberId(props.myMemberId);
    oppsCtrl.setMemberId(props.myMemberId);
    myRolesCtrl.setMyAddress(props.myAddress);
  }, [props.myMemberId, props.myAddress]);

  const { basePath } = props;

  if (props.myAddress) {
    tabs.push({
      name: 'my-roles',
      text: t('My roles and applications')
    });
  }

  return (
    <main className='roles--App'>
      <Banner>
        <BannerText>
          As Working Group Members you are eligible to share your testnet contributions to have a chance at becoming a Founding Member.
          Make sure to do that to get a portion of the initial mainnet tokens and other interesting accolades. Get started <a href='https://www.joystream.org/founding-members' target='_blank' rel='noreferrer'>here</a>!
        </BannerText>
      </Banner>
      <header>
        <Tabs
          basePath={basePath}
          items={tabs}
        />
      </header>
      <Switch>
        <Route
          path={`${basePath}/opportunities/:group/:id([0-9]+)/apply`}
          render={(props: DefaultRouteProps) => <ApplyView controller={applyCtrl} params={props.match.params}/>} />
        <Route
          path={`${basePath}/opportunities/:group/:id([0-9]+)`}
          render={(props: DefaultRouteProps) => <OpportunityView controller={oppCtrl} params={props.match.params}/>} />
        <Route
          path={`${basePath}/opportunities/:group/:lead(lead)?`}
          render={(props: DefaultRouteProps) => <OpportunitiesView controller={oppsCtrl} params={props.match.params}/>} />
        <Route
          path={`${basePath}/opportunities`}
          render={(props: DefaultRouteProps) => <OpportunitiesView controller={oppsCtrl} params={props.match.params}/>} />
        <Route
          path={`${basePath}/my-roles`}
          render={(props: DefaultRouteProps) => <MyRolesView controller={myRolesCtrl} params={props.match.params}/>} />
        <Route
          render={(props: DefaultRouteProps) => <WorkingGroupsView controller={wgCtrl} params={props.match.params}/> } />
      </Switch>
    </main>
  );
};

export default withMulti(
  App,
  translate,
  withMyAccount
);
