
import React from 'react';
import { Route, Switch } from 'react-router';

import { AppProps, I18nProps } from '@polkadot/react-components/types';
import Tabs, { TabItem } from '@polkadot/react-components/Tabs';
import { ApiProps } from '@polkadot/react-api/types';
import { withMulti } from '@polkadot/react-api/with';

import './index.css';
import './common/index.css';

import translate from './translate';
import { useMyAccount } from '@polkadot/joy-utils/MyAccountContext';
import Upload from './Upload';
import Explore from './Explore';
import { Play } from './View';
import { EditByContentId } from './EditMeta';
import { withDiscoveryProvider, DiscoveryProviderProps } from './DiscoveryProvider';
import { SubstrateTransportProvider } from './TransportContext';
import { ChannelsByOwnerWithRouter } from './channels/ChannelsByOwner.view';
import { EditChannelView, EditChannelWithRouter } from './channels/EditChannel.view';
import { ExploreContentView } from './explore/ExploreContent.view';
import { ViewChannelWithRouter } from './channels/ViewChannel.view';
import { UploadVideoWithRouter } from './upload/EditVideo.view';
import { EditVideoWithRouter } from './upload/EditVideo.view';
import { PlayVideoWithRouter } from './video/PlayVideo.view';
// import { VideosByOwner } from './video/VideosByOwner';

type Props = AppProps & I18nProps & ApiProps & DiscoveryProviderProps & {};

function App(props: Props) {
  const { t, basePath, api, discoveryProvider } = props;
  const { state: { address: myAddress } } = useMyAccount();

  const tabs: TabItem[] = [
    {
      isRoot: true,
      name: 'explore',
      text: t('Explore')
    },
    !myAddress ? undefined : {
      name: `account/${myAddress}/channels`,
      text: t('My channels')
    },
    {
      name: 'channels/new',
      text: t('New channel')
    },
    !myAddress ? undefined : {
      name: `account/${myAddress}/videos`,
      text: t('My videos')
    },
    {
      name: 'deprecated-explore',
      text: t('OLD: Explore')
    },
    {
      name: 'upload',
      text: t('OLD: Upload')
    }
  ].filter(x => x !== undefined) as TabItem[];

  return (
    <SubstrateTransportProvider>
      <main className='media--App'>
        <header>
          <Tabs basePath={basePath} items={tabs} />
        </header>
        <Switch>
          <Route path={`${basePath}/deprecated-explore`} component={Explore} />
          <Route path={`${basePath}/play/:assetName`} render={(props) => <Play {...props} discoveryProvider={discoveryProvider} api={api} />} />
          <Route path={`${basePath}/upload`} render={(props) => <Upload {...props} discoveryProvider={discoveryProvider} api={api} />} />
          <Route path={`${basePath}/edit/:assetName`} component={EditByContentId} />
          <Route path={`${basePath}/account/:account/channels`} component={ChannelsByOwnerWithRouter} />
          <Route path={`${basePath}/channels/new`} component={EditChannelView} />
          <Route path={`${basePath}/channels/:id/edit`} component={EditChannelWithRouter} />
          <Route path={`${basePath}/channels/:channelId/upload`} component={UploadVideoWithRouter} />
          <Route path={`${basePath}/channels/:id`} component={ViewChannelWithRouter} />
          {/* <Route path={`${basePath}/video/my`} component={VideosByOwnerView} /> */}
          <Route path={`${basePath}/video/:id/edit`} component={EditVideoWithRouter} />
          <Route path={`${basePath}/video/:id`} component={PlayVideoWithRouter} />
          <Route path={`${basePath}/explore`} component={ExploreContentView} />
          <Route component={ExploreContentView} />
        </Switch>
      </main>
    </SubstrateTransportProvider>
  );
}

export default withMulti(
  App,
  translate,
  withDiscoveryProvider
);
