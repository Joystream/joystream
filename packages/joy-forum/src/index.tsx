
import React from 'react';
import { Route, Switch } from 'react-router';

import { AppProps, I18nProps } from '@polkadot/ui-app/types';
import Tabs, { TabItem } from '@polkadot/ui-app/Tabs';

import './index.css';

import translate from './translate';
import { ForumProvider } from './Context';
import { NewCategory, EditCategory } from './EditCategory';
import { NewThread, EditThread } from './EditThread';
import { NewReply, EditReply } from './EditReply';
import { RootCategories, ViewCategoryById } from './RootCategories';
import { ViewThreadById } from './ViewThread';
import { ViewReplyById } from './ViewReply';

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
        // TODO show this tab only if current user is the sudo:
        name: 'categories/new',
        text: t('New category')
      }
    ];
  }

  render () {
    const { basePath } = this.props;
    const tabs = this.buildTabs();
    return (
      <ForumProvider>
      <main className='forum--App'>
        <header>
          <Tabs basePath={basePath} items={tabs} />
        </header>
        <Switch>
          <Route path={`${basePath}/categories/new`} component={NewCategory} />
          <Route path={`${basePath}/categories/:id/newThread`} component={NewThread} />
          <Route path={`${basePath}/categories/:id/edit`} component={EditCategory} />
          <Route path={`${basePath}/categories/:id`} component={ViewCategoryById} />
          <Route path={`${basePath}/categories`} component={RootCategories} />

          <Route path={`${basePath}/threads/:id/reply`} component={NewReply} />
          <Route path={`${basePath}/threads/:id/edit`} component={EditThread} />
          <Route path={`${basePath}/threads/:id`} component={ViewThreadById} />

          <Route path={`${basePath}/replies/:id/edit`} component={EditReply} />
          <Route path={`${basePath}/replies/:id`} component={ViewReplyById} />

          <Route component={RootCategories} />
        </Switch>
      </main>
      </ForumProvider>
    );
  }
}

export default translate(App);
