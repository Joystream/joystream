import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Segment, Tab } from 'semantic-ui-react';
import { AccountId } from '@polkadot/types/interfaces';
import { ChannelEntity } from '../entities/ChannelEntity';
import { YouHaveNoChannels } from './YouHaveNoChannels';
import { ChannelContentTypeValue } from '@joystream/types/content-working-group';
import { ChannelPreview } from './ChannelPreview';

export type ChannelsByOwnerProps = {
  accountId: AccountId,
  suspended?: boolean,
  channels?: ChannelEntity[]
};

const TabsAndChannels = (props: ChannelsByOwnerProps) => {
  const { channels: allChannels = [] } = props;
  const [ channels, setChannels ] = useState(allChannels);

  let videoChannelsCount = 0;
  let musicChannelsCount = 0;
  allChannels.forEach(x => {
    if (x.content === 'Video') {
      videoChannelsCount++;
    } else if (x.content === 'Music') {
      musicChannelsCount++;
    }
  });

  const panes = [
    { menuItem: `All channels (${allChannels.length})` },
    { menuItem: `Video channels (${videoChannelsCount})` },
    { menuItem: `Music channels (${musicChannelsCount})` }
  ];

  const contentTypeByTabIndex: Array<ChannelContentTypeValue | undefined> =
    [ undefined, 'Video', 'Music' ];

  const switchTab = (activeIndex: number) => {
    const activeContentType = contentTypeByTabIndex[activeIndex];
    if (activeContentType === undefined) {
      setChannels(allChannels)
    } else {
      setChannels(allChannels.filter(
        (x) => x.content === activeContentType)
      )
    }
  }

  return <>
    <Tab
      panes={panes}
      menu={{ secondary: true }}
      style={{ display: 'inline-flex', margin: '0 2rem 1rem 0' }}
      onTabChange={(_e, data) => switchTab(data.activeIndex as number)}
    />
    <Link to={`/media/channels/new`} className='ui button'>
      <i className='icon plus' />
      Create Channel
    </Link>
    {channels.map((channel) =>
      <Segment key={channel.id} padded style={{ backgroundColor: '#fff' }}>
        <ChannelPreview channel={channel} withDescription />
      </Segment>
    )}
  </>
}

export function ChannelsByOwner (props: ChannelsByOwnerProps) {
  const { suspended = false, channels = [] } = props;

  return <div className='JoyChannels'>
    {!channels.length
      ? <YouHaveNoChannels suspended={suspended} />
      : <TabsAndChannels {...props} />
    }</div>;
}
