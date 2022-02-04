import React from 'react';
import { Route, Switch } from 'react-router';

import { I18nProps } from '@polkadot/react-components/types';
import { RouteProps as AppMainRouteProps } from '@polkadot/apps-routing/types';
import { withCalls } from '@polkadot/react-api/hoc';
import { AccountId, Hash } from '@polkadot/types/interfaces';
import Tabs from '@polkadot/react-components/Tabs';
import { TabItem } from '@polkadot/react-components/Tabs/types';

// our app-specific styles
import style from './style';
import styled from 'styled-components';

// local imports and components
import translate from './translate';
import Dashboard from './Dashboard';
import Council from './Council';
import Applicants from './Applicants';
import Votes from './Votes';
import Reveals from './Reveals';
import { queryToProp } from '@polkadot/joy-utils/functions/misc';
import { Seat } from '@joystream/types/council';
import { ApiProps } from '@polkadot/react-api/types';

const ElectionMain = styled.main`${style}`;

// define out internal types
type Props = AppMainRouteProps & ApiProps & I18nProps & {
  activeCouncil?: Seat[];
  applicants?: AccountId[];
  commitments?: Hash[];
};

type State = Record<any, never>;

class App extends React.PureComponent<Props, State> {
  state: State = {};

  private buildTabs (): TabItem[] {
    const { t, activeCouncil = [], applicants = [], commitments = [] } = this.props;

    return [
      {
        isRoot: true,
        name: 'council',
        text: t('Dashboard')
      },
      {
        name: 'members',
        text: t('Council members') + ` (${activeCouncil.length})`
      },
      {
        name: 'applicants',
        text: t('Applicants') + ` (${applicants.length})`
      },
      {
        name: 'votes',
        text: t('Votes') + ` (${commitments.length})`
      }
    ];
  }

  render () {
    const { basePath } = this.props;
    const tabs = this.buildTabs();

    return (
      <ElectionMain className='election--App'>
        <header>
          <Tabs basePath={basePath} items={tabs} />
        </header>
        <Switch>
          <Route path={`${basePath}/members`} component={Council} />
          <Route path={`${basePath}/applicants`} component={Applicants} />
          <Route path={`${basePath}/votes`} component={Votes} />
          <Route path={`${basePath}/reveals`} component={Reveals} />
          <Route component={Dashboard} />
        </Switch>
      </ElectionMain>
    );
  }
}

export default translate(
  withCalls<Props>(
    queryToProp('query.council.activeCouncil'),
    queryToProp('query.councilElection.applicants'),
    queryToProp('query.councilElection.commitments')
  )(App)
);
