
import React from 'react';
import { Route, Switch } from 'react-router';
import styled from 'styled-components';

import { RouteProps as AppMainRouteProps } from '@polkadot/apps-routing/types';
import { I18nProps } from '@polkadot/react-components/types';

import style from './style';
import translate from './translate';
import { ForumProvider } from './Context';
import { ForumSudoProvider } from './ForumSudo';
import { NewSubcategory, NewCategory, EditCategory } from './EditCategory';
import { NewThread, EditThread } from './EditThread';
import { CategoryList, ViewCategoryById } from './CategoryList';
import { ViewThreadById } from './ViewThread';
import { LegacyPagingRedirect } from './LegacyPagingRedirect';
import ForumRoot from './ForumRoot';

const ForumMain = styled.main`${style}`;

const Banner = styled.div`
  height: 150px;
  display: flex;
  justify-content: center;
  margin: 0 -2em 15px -2em;
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

type Props = AppMainRouteProps & I18nProps;

class App extends React.PureComponent<Props> {
  render () {
    const { basePath } = this.props;

    return (
      <ForumProvider>
        <ForumSudoProvider>
          <ForumMain className='forum--App'>
            <Banner>
              <BannerText>
                By being an active contributor to the platform you are eligible to share your testnet contributions to have a chance at becoming a Founding Member.
                Make sure to do that to get a portion of the initial mainnet tokens and other interesting accolades. Get started <a href='https://www.joystream.org/founding-members' target='_blank' rel='noreferrer'>here</a>!
              </BannerText>
            </Banner>
            <Switch>
              <Route path={`${basePath}/categories/new`} component={NewCategory} />
              {/* routes for handling legacy format of forum paging within the routing path */}
              {/* translate page param to search query */}
              <Route path={`${basePath}/categories/:id/page/:page`} component={LegacyPagingRedirect} />
              <Route path={`${basePath}/threads/:id/page/:page`} component={LegacyPagingRedirect} />

              <Route path={`${basePath}/categories/:id/newSubcategory`} component={NewSubcategory} />
              <Route path={`${basePath}/categories/:id/newThread`} component={NewThread} />
              <Route path={`${basePath}/categories/:id/edit`} component={EditCategory} />
              <Route path={`${basePath}/categories/:id`} component={ViewCategoryById} />
              <Route path={`${basePath}/categories`} component={CategoryList} />

              <Route path={`${basePath}/threads/:id/edit`} component={EditThread} />
              <Route path={`${basePath}/threads/:id`} component={ViewThreadById} />

              <Route component={ForumRoot} />
            </Switch>
          </ForumMain>
        </ForumSudoProvider>
      </ForumProvider>
    );
  }
}

export default translate(App);
