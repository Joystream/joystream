
import React from 'react';
import { Route, Switch } from 'react-router';

import { AppProps, I18nProps } from '@polkadot/react-components/types';
import Tabs, { TabItem } from '@polkadot/react-components/Tabs';

import './index.css';

import translate from './translate';
import { ForumProvider } from './Context';
import { EditForumSudo, ForumSudoProvider } from './ForumSudo';
import { NewCategory, NewSubcategory, EditCategory } from './EditCategory';
import { NewThread, EditThread } from './EditThread';
import { NewReply, EditReply } from './EditReply';
import { CategoryList, ViewCategoryById } from './CategoryList';
import { ViewThreadById } from './ViewThread';

type Props = AppProps & I18nProps & {};

class App extends React.PureComponent<Props> {

  private buildTabs (): TabItem[] {
    const { t } = this.props;
    return [
      {
        isRoot: true,
        name: 'forum',
        text: t('Forum')
      },
      {
        // TODO show this tab only if current user is the sudo:
        name: 'categories/new',
        text: t('New category')
      },
      {
        name: 'sudo',
        text: t('Forum sudo')
      }
    ];
  }

  render () {
    const { basePath } = this.props;
    const tabs = this.buildTabs();
    return (
      <ForumProvider>
      <ForumSudoProvider>
      <main className='forum--App'>
        <header>
          <Tabs basePath={basePath} items={tabs} />
        </header>
        <Switch>
          <Route path={`${basePath}/sudo`} component={EditForumSudo} />

          <Route path={`${basePath}/categories/new`} component={NewCategory} />
          <Route path={`${basePath}/categories/:id/newSubcategory`} component={NewSubcategory} />
          <Route path={`${basePath}/categories/:id/newThread`} component={NewThread} />
          <Route path={`${basePath}/categories/:id/edit`} component={EditCategory} />
          <Route path={`${basePath}/categories/:id/page/:page`} component={ViewCategoryById} />
          <Route path={`${basePath}/categories/:id`} component={ViewCategoryById} />
          <Route path={`${basePath}/categories`} component={CategoryList} />

          <Route path={`${basePath}/threads/:id/reply`} component={NewReply} />
          <Route path={`${basePath}/threads/:id/edit`} component={EditThread} />
          <Route path={`${basePath}/threads/:id/page/:page`} component={ViewThreadById} />
          <Route path={`${basePath}/threads/:id`} component={ViewThreadById} />

          <Route path={`${basePath}/replies/:id/edit`} component={EditReply} />
          {/* <Route path={`${basePath}/replies/:id`} component={ViewReplyById} /> */}

          <Route component={CategoryList} />
        </Switch>
      </main>
      </ForumSudoProvider>
      </ForumProvider>
    );
  }
}

export default translate(App);
