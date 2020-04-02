
import React from 'react';
import { Route, Switch } from 'react-router';
import { AppProps, I18nProps } from '@polkadot/react-components/types';
import { ApiProps } from '@polkadot/react-api/types';
import Tabs, { TabItem } from '@polkadot/react-components/Tabs';
import translate from './translate';

// App-specific styles
import './index.css';

const NotImplementedYet = () => <em>Not implemented yet</em>

// define out internal types
type Props = AppProps & ApiProps & I18nProps & {}

function App(props: Props) {
  const { t, basePath } = props;
  const activeCount = 0 // TODO get count
  const finalizedCount = 0 // TODO get count

  const tabs: TabItem[] = [
    {
      isRoot: true,
      name: 'active',
      text: t('Active') + ` (${activeCount})`
    },
    {
      name: 'finalized',
      text: t('Finalized') + ` (${finalizedCount})`
    },
    {
      name: 'new',
      text: t('Create new')
    }
  ]

  return (
    <main className='proposals--App'>
      <header>
        <Tabs basePath={basePath} items={tabs} />
      </header>
      <Switch>
        <Route path={`${basePath}/active`} component={NotImplementedYet} />
        <Route path={`${basePath}/finalized`} component={NotImplementedYet} />
        <Route path={`${basePath}/new`} component={NotImplementedYet} />
        <Route path={`${basePath}/:id`} component={NotImplementedYet} />
        <Route component={NotImplementedYet} />
      </Switch>
    </main>
  );
}

export default translate(App)
