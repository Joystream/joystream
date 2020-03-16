
import BN from 'bn.js';
import React from 'react';
import { Route, Switch } from 'react-router';

import { AppProps, I18nProps } from '@polkadot/react-components/types';
import { ApiProps } from '@polkadot/react-api/types';
import { withCalls, withMulti } from '@polkadot/react-api/with';
import Tabs, { TabItem } from '@polkadot/react-components/Tabs';

import './index.css';

import { queryMembershipToProp } from './utils';
import translate from './translate';
import Dashboard from './Dashboard';
import List from './List';
import DetailsByHandle from './DetailsByHandle';
import EditForm from './EditForm';
import { withMyAccount, MyAccountProps } from '@polkadot/joy-utils/MyAccount';
import {FIRST_MEMBER_ID} from './constants';

// define out internal types
type Props = AppProps & ApiProps & I18nProps & MyAccountProps & {
  membersCreated?: BN
};

class App extends React.PureComponent<Props> {

  private buildTabs (): TabItem[] {
    const { t, membersCreated: memberCount, iAmMember } = this.props;

    return [
      {
        isRoot: true,
        name: 'members',
        text: t('All members') + ` (${memberCount})`
      },
      {
        name: 'edit',
        text: iAmMember ? t('Edit my profile') : t('Register')
      },
      {
        name: 'dashboard',
        text: t('Dashboard')
      }
    ];
  }

  private renderList () {
    const { membersCreated, ...otherProps } = this.props;
    return membersCreated ?
      <List firstMemberId={FIRST_MEMBER_ID} membersCreated={membersCreated} {...otherProps} />
      : <em>Loading...</em>;
  }

  render () {
    const { basePath } = this.props;
    const tabs = this.buildTabs();
    const list = () => this.renderList();

    return (
      <main className='members--App'>
        <header>
          <Tabs basePath={basePath} items={tabs} />
        </header>
        <Switch>
          <Route path={`${basePath}/edit`} component={EditForm} />
          <Route path={`${basePath}/dashboard`} component={Dashboard} />
          <Route path={`${basePath}/:handle`} component={DetailsByHandle} />
          <Route render={list} />
        </Switch>
      </main>
    );
  }
}

export default withMulti(
  App,
  translate,
  withMyAccount,
  withCalls<Props>(
    queryMembershipToProp('membersCreated')
  )
);
