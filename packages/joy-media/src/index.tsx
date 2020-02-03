
import React from 'react';
import { Route, Switch } from 'react-router';

import { AppProps, I18nProps } from '@polkadot/react-components/types';
import Tabs, { TabItem } from '@polkadot/react-components/Tabs';
import { ApiProps } from '@polkadot/react-api/types';
import { withMulti } from '@polkadot/react-api/with';

import './index.css';
import './common/index.css';

import translate from './translate';
import Upload from './Upload';
import Explore from './Explore';
import { Play } from './View';
import { EditByContentId } from './EditMeta';
import { withDiscoveryProvider, DiscoveryProviderProps } from './DiscoveryProvider';
import { MockTransportProvider } from './MediaView';
import { ChannelsByOwnerView } from './channels/ChannelsByOwner.view';
import { EditChannelView, EditChannelWithRouter } from './channels/EditChannel.view';
import { ExploreContentView } from './explore/ExploreContent.view';
import { ViewChannelWithRouter } from './channels/ViewChannel.view';

type Props = AppProps & I18nProps & ApiProps & DiscoveryProviderProps & {};

class App extends React.PureComponent<Props> {

  private buildTabs (): TabItem[] {
    const { t } = this.props;
    return [
      {
        isRoot: true,
        name: 'explore',
        text: t('Explore')
      },
      {
        name: 'channels/my',
        text: t('My channels')
      },
      {
        name: 'channels/new',
        text: t('New channel')
      },
      {
        name: 'media',
        text: t('OLD: Explore')
      },
      {
        name: 'upload',
        text: t('OLD: Upload')
      }
    ];
  }

  render () {
    const { basePath, discoveryProvider, api } = this.props;
    const tabs = this.buildTabs();
    return (
      <MockTransportProvider>
        <main className='media--App'>
          <header>
            <Tabs basePath={basePath} items={tabs} />
          </header>
          <Switch>
            <Route path={`${basePath}/deprecated-explore`} component={Explore} />
            <Route path={`${basePath}/play/:assetName`} render={(props) => <Play {...props} discoveryProvider={discoveryProvider} api={api} />} />
            <Route path={`${basePath}/upload`} render={(props) => <Upload {...props} discoveryProvider={discoveryProvider} api={api} />} />
            <Route path={`${basePath}/edit/:assetName`} component={EditByContentId} />
            <Route path={`${basePath}/channels/my`} component={ChannelsByOwnerView} />
            <Route path={`${basePath}/channels/new`} component={EditChannelView} />
            <Route path={`${basePath}/channels/:id/edit`} component={EditChannelWithRouter} />
            <Route path={`${basePath}/channels/:id`} component={ViewChannelWithRouter} />
            <Route path={`${basePath}/explore`} component={ExploreContentView} />
            <Route component={ExploreContentView} />
          </Switch>
        </main>
      </MockTransportProvider>
    );
  }
}

export default withMulti(
  App,
  translate,
  withDiscoveryProvider
);
