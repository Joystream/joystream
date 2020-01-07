
import React from 'react';
import { Route, Switch } from 'react-router';

import { AppProps, I18nProps } from '@polkadot/react-components/types';
import Tabs, { TabItem } from '@polkadot/react-components/Tabs';

import './index.css';
import './common/index.css';

import translate from './translate';
import Upload from './Upload';
import Explore from './Explore';
import { Play } from './View';
import { EditByContentId } from './EditMeta';
import { withDiscoveryProvider, DiscoveryProviderProps } from './DiscoveryProvider';
import { ApiProps } from '@polkadot/react-api/types';
import { withMulti } from '@polkadot/react-api/with';

type Props = AppProps & I18nProps & ApiProps & DiscoveryProviderProps & {};

class App extends React.PureComponent<Props> {

  private buildTabs (): TabItem[] {
    const { t } = this.props;
    return [
      {
        isRoot: true,
        name: 'media',
        text: t('Explore')
      },
      {
        name: 'upload',
        text: t('Upload')
      }
    ];
  }

  render () {
    const { basePath, discoveryProvider, api } = this.props;
    const tabs = this.buildTabs();
    return (
      <main className='media--App'>
        <header>
          <Tabs basePath={basePath} items={tabs} />
        </header>
        <Switch>
          <Route path={`${basePath}/play/:assetName`} render={(props) => <Play {...props} discoveryProvider={discoveryProvider} api={api} />} />
          <Route path={`${basePath}/upload`} render={(props) => <Upload {...props} discoveryProvider={discoveryProvider} api={api} />} />
          <Route path={`${basePath}/edit/:assetName`} component={EditByContentId} />
          <Route component={Explore} />
        </Switch>
      </main>
    );
  }
}

export default withMulti(
  App,
  translate,
  withDiscoveryProvider
);
