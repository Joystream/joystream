import React from 'react';
import { useTranslation } from './translate';
import { Route, Switch } from 'react-router';
import { Tabs } from '@polkadot/react-components';
import Overview from './Overview';
import { AppProps, I18nProps } from '@polkadot/react-components/types';
import { TransportProvider } from '@polkadot/joy-utils/react/context';

interface Props extends AppProps, I18nProps {}

function App ({ basePath }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  return (
    <TransportProvider>
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
    </TransportProvider>
  );
}

export default App;
