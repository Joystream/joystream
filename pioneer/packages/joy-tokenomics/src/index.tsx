import React from 'react';
import translate from './translate';
import { Route, Switch } from 'react-router';
import { Tabs } from '@polkadot/react-components';
import Overview from './Overview';

import { AppProps, I18nProps } from '@polkadot/react-components/types';

interface Props extends AppProps, I18nProps {}

function App ({ basePath, t }: Props): React.ReactElement<Props> {
  return (
    <main>
      <header>
        <Tabs
          basePath={basePath}
          items={[
            {
              isRoot: true,
              name: 'overview',
              text: t('Tokenomics')
            }
          ]}
        />
      </header>
      <Switch>
        <Route component={Overview} />
      </Switch>
    </main>
  );
}

export default translate(App);
