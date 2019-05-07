
import React from 'react';
import { Route, Switch } from 'react-router';

import { AppProps, I18nProps } from '@polkadot/ui-app/types';
import Tabs, { TabItem } from '@polkadot/ui-app/Tabs';

import './index.css';

import translate from './translate';

function Forum () {
  return <em>TODO Forum</em>;
}

function NewCategory () {
  return <em>TODO New Category</em>;
}

function EditCategory () {
  return <em>TODO Edit Category</em>;
}

function ViewCategory () {
  return <em>TODO View Category: subcategories and threads</em>;
}

function TopCategories () {
  return <em>TODO List of Top Categories</em>;
}

function NewThread () {
  return <em>TODO New Thread</em>;
}

function EditThread () {
  return <em>TODO Edit Thread</em>;
}

function ViewThread () {
  return <em>TODO View Thread: details and replies</em>;
}

type Props = AppProps & I18nProps & {};

class App extends React.PureComponent<Props> {

  private buildTabs (): TabItem[] {
    const { t } = this.props;
    return [
      {
        name: 'forum',
        text: t('Forum')
      },
      {
        name: 'categories/new',
        text: t('New category')
      },
      {
        name: 'threads/new',
        text: t('New thread')
      }
    ];
  }

  render () {
    const { basePath } = this.props;
    const tabs = this.buildTabs();
    return (
      <main className='forum--App'>
        <header>
          <Tabs basePath={basePath} items={tabs} />
        </header>
        <Switch>
          <Route path={`${basePath}/categories/new`} component={NewCategory} />
          <Route path={`${basePath}/categories/:categoryId/edit`} component={EditCategory} />
          <Route path={`${basePath}/categories/:categoryId`} component={ViewCategory} />
          <Route path={`${basePath}/categories`} component={TopCategories} />

          <Route path={`${basePath}/threads/new`} component={NewThread} />
          <Route path={`${basePath}/threads/:threadId/edit`} component={EditThread} />
          <Route path={`${basePath}/threads/:threadId`} component={ViewThread} />

          <Route component={Forum} />
        </Switch>
      </main>
    );
  }
}

export default translate(App);
