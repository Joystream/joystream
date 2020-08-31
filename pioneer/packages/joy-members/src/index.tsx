
import BN from 'bn.js';
import React from 'react';
import { Route, Switch } from 'react-router';

import { AppProps, I18nProps } from '@polkadot/react-components/types';
import { ApiProps } from '@polkadot/react-api/types';
import { withCalls, withMulti } from '@polkadot/react-api/hoc';
import Tabs from '@polkadot/react-components/Tabs';
import { TabItem } from '@polkadot/react-components/Tabs/types';

import { queryMembershipToProp } from './utils';
import translate from './translate';
import Dashboard from './Dashboard';
import List from './List';
import DetailsByHandle from './DetailsByHandle';
import EditForm from './EditForm';
import { withMyAccount, MyAccountProps } from '@polkadot/joy-utils/react/hocs/accounts';
import { FIRST_MEMBER_ID } from './constants';
import { RouteComponentProps } from 'react-router-dom';

import styled from 'styled-components';
import style from './style';

const MembersMain = styled.main`${style}`;

// define out internal types
type Props = AppProps & ApiProps & I18nProps & MyAccountProps & {
  nextMemberId?: BN;
};

class App extends React.PureComponent<Props> {
  private buildTabs (): TabItem[] {
    const { t, nextMemberId: memberCount, iAmMember } = this.props;

    return [
      {
        name: 'list',
        text: t('All members') + ` (${memberCount?.toString() || '-'})`,
        forceMatchParams: true
      },
      {
        name: 'edit',
        text: iAmMember ? 'My profile' : t('Register')
      },
      {
        name: 'dashboard',
        text: t('Dashboard')
      }
    ];
  }

  private renderList (routeProps: RouteComponentProps) {
    const { nextMemberId, ...otherProps } = this.props;

    return nextMemberId
      ? <List firstMemberId={FIRST_MEMBER_ID} membersCreated={nextMemberId} {...otherProps} {...routeProps}/>
      : <em>Loading...</em>;
  }

  render () {
    const { basePath } = this.props;
    const tabs = this.buildTabs();

    return (
      <MembersMain className='members--App'>
        <header>
          <Tabs basePath={basePath} items={tabs} />
        </header>
        <Switch>
          <Route path={`${basePath}/edit`} component={EditForm} />
          <Route path={`${basePath}/dashboard`} component={Dashboard} />
          <Route path={`${basePath}/list/:page([0-9]+)?`} render={ (props) => this.renderList(props) } />
          <Route exact={true} path={`${basePath}/:handle`} component={DetailsByHandle} />
          <Route render={ (props) => this.renderList(props) } />
        </Switch>
      </MembersMain>
    );
  }
}

export default withMulti(
  App,
  translate,
  withMyAccount,
  withCalls<Props>(
    queryMembershipToProp('nextMemberId')
  )
);
