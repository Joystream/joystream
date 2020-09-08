// Copyright 2017-2019 @polkadot/app-address-book authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { AppProps, I18nProps } from '@polkadot/react-components/types';
import { SubjectInfo } from '@polkadot/ui-keyring/observable/types';
import { ComponentProps } from './types';

import React from 'react';
import { Route, Switch } from 'react-router';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { Breadcrumb } from 'semantic-ui-react';
import { HelpOverlay } from '@polkadot/react-components';

import basicMd from './md/basic.md';
import Overview from './Overview';
import translate from './translate';
import MemoByAccount from './MemoByAccount';

interface Props extends AppProps, I18nProps {
  allAddresses?: SubjectInfo;
  location: any;
}

const StyledHeader = styled.header`
  text-align: left;

  .ui.breadcrumb {
    padding: 1.4rem 0 0 .4rem;
    font-size: 1.4rem;
  }
`;

function AddressBookApp ({ basePath, onStatusChange }: Props): React.ReactElement<Props> {
  const _renderComponent = (Component: React.ComponentType<ComponentProps>): () => React.ReactNode => {
    // eslint-disable-next-line react/display-name
    return (): React.ReactNode =>
      <Component
        basePath={basePath}
        location={location}
        onStatusChange={onStatusChange}
      />;
  };

  const viewMemoPath = `${basePath}/memo/:accountId?`;

  return (
    <main className='address-book--App'>
      <HelpOverlay md={basicMd} />
      <StyledHeader>
        <Breadcrumb>
          <Switch>
            <Route path={viewMemoPath}>
              <Breadcrumb.Section link as={Link} to={basePath}>Contacts</Breadcrumb.Section>
              <Breadcrumb.Divider icon="right angle" />
              <Breadcrumb.Section active>View memo</Breadcrumb.Section>
            </Route>
            <Route>
              <Breadcrumb.Section active>Contacts</Breadcrumb.Section>
            </Route>
          </Switch>
        </Breadcrumb>
      </StyledHeader>
      <Switch>
        <Route path={viewMemoPath} component={MemoByAccount} />
        <Route render={_renderComponent(Overview)} />
      </Switch>
    </main>
  );
}

export default translate(AddressBookApp);
