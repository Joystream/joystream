
import React from 'react';
import { Route, Switch } from 'react-router';
import styled from 'styled-components';

import { AppProps, I18nProps } from '@polkadot/react-components/types';

import './index.css';

import translate from './translate';
import { ForumProvider } from './Context';
import { ForumSudoProvider } from './ForumSudo';
import { NewSubcategory, EditCategory } from './EditCategory';
import { NewThread, EditThread } from './EditThread';
import { CategoryList, ViewCategoryById } from './CategoryList';
import { ViewThreadById } from './ViewThread';
import { LegacyPagingRedirect } from './LegacyPagingRedirect';
import ForumRoot from './ForumRoot';

const ForumContentWrapper = styled.main`
  padding-top: 1.5rem;
`;

type Props = AppProps & I18nProps & {};

class App extends React.PureComponent<Props> {
  render () {
    const { basePath } = this.props;
    return (
      <ForumProvider>
        <ForumSudoProvider>
          <ForumContentWrapper className='forum--App'>
            <Switch>
              {/* routes for handling legacy format of forum paging within the routing path */}
              {/* translate page param to search query */}
              <Route path={`${basePath}/categories/:id/page/:page`} component={LegacyPagingRedirect} />
              <Route path={`${basePath}/threads/:id/page/:page`} component={LegacyPagingRedirect} />

              {/* <Route path={`${basePath}/sudo`} component={EditForumSudo} /> */}
              {/* <Route path={`${basePath}/categories/new`} component={NewCategory} /> */}

              <Route path={`${basePath}/categories/:id/newSubcategory`} component={NewSubcategory} />
              <Route path={`${basePath}/categories/:id/newThread`} component={NewThread} />
              <Route path={`${basePath}/categories/:id/edit`} component={EditCategory} />
              <Route path={`${basePath}/categories/:id`} component={ViewCategoryById} />
              <Route path={`${basePath}/categories`} component={CategoryList} />

              <Route path={`${basePath}/threads/:id/edit`} component={EditThread} />
              <Route path={`${basePath}/threads/:id`} component={ViewThreadById} />

              <Route component={ForumRoot} />
            </Switch>
          </ForumContentWrapper>
        </ForumSudoProvider>
      </ForumProvider>
    );
  }
}

export default translate(App);
