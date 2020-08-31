
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
import { UploadWithRouter } from './Upload';
import { DiscoveryProviderProps, DiscoveryProviderProvider } from './DiscoveryProvider';
import { SubstrateTransportProvider } from './TransportContext';
import { ChannelsByOwnerWithRouter } from './channels/ChannelsByOwner.view';
import { EditChannelView, EditChannelWithRouter } from './channels/EditChannel.view';
import { ExploreContentView } from './explore/ExploreContent.view';
import { ViewChannelWithRouter } from './channels/ViewChannel.view';
import { EditVideoWithRouter } from './upload/EditVideo.view';
import { PlayVideoWithRouter } from './video/PlayVideo.view';
import { AllVideosView } from './explore/AllVideos';
import { AllChannelsView } from './explore/AllChannels';
// import { VideosByOwner } from './video/VideosByOwner';

type Props = AppProps & I18nProps & ApiProps & DiscoveryProviderProps & {};

function App (props: Props) {
  const { t, basePath } = props;
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
    }
    // !myAddress ? undefined : {
    //   name: `account/${myAddress}/videos`,
    //   text: t('My videos')
    // }
  ].filter(x => x !== undefined) as TabItem[];

  return (
    <SubstrateTransportProvider>
      <DiscoveryProviderProvider>
        <main className='media--App'>
          <header>
            <Tabs basePath={basePath} items={tabs} />
          </header>
          <Switch>
            <Route path={`${basePath}/account/:account/channels`} component={ChannelsByOwnerWithRouter} />
            <Route path={`${basePath}/channels/new`} component={EditChannelView} />
            <Route path={`${basePath}/channels/:id/edit`} component={EditChannelWithRouter} />
            <Route path={`${basePath}/channels/:channelId/upload`} component={UploadWithRouter} />
            <Route path={`${basePath}/channels/:id`} component={ViewChannelWithRouter} />
            <Route path={`${basePath}/channels/:id`} component={ViewChannelWithRouter} />
            <Route path={`${basePath}/channels`} component={AllChannelsView} />
            {/* <Route path={`${basePath}/videos/my`} component={VideosByOwnerView} /> */}
            <Route path={`${basePath}/videos/:id/edit`} component={EditVideoWithRouter} />
            <Route path={`${basePath}/videos/:id`} component={PlayVideoWithRouter} />
            <Route path={`${basePath}/videos`} component={AllVideosView} />
            <Route path={`${basePath}/explore`} component={ExploreContentView} />
            <Route component={ExploreContentView} />
          </Switch>
        </main>
      </DiscoveryProviderProvider>
    </SubstrateTransportProvider>
  );
}

export default withMulti(
  App,
  translate
);
