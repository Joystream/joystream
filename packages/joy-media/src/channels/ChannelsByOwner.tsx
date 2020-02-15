import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Segment, Icon, Label, SemanticICONS, SemanticCOLORS, Tab } from 'semantic-ui-react';

import { AccountId } from '@polkadot/types/interfaces';
import { ChannelEntity } from '../entities/ChannelEntity';
import { YouHaveNoChannels } from './YouHaveNoChannels';
import { ChannelAvatar } from './ChannelAvatar';
import { isPublicChannel } from './ChannelHelpers';
import { ChannelContentTypeValue } from '@joystream/types/content-working-group';

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
    {channels.map((x, i) => <ChannelPreview key={'ChannelPreview-' + i} channel={x} />)}
  </>
}

type ChannelPreviewProps = {
  channel: ChannelEntity
};

const ChannelPreview = (props: ChannelPreviewProps) => {
  const { channel } = props;

  let visibilityIcon: SemanticICONS = 'eye';
  let visibilityColor: SemanticCOLORS = 'green';
  let visibilityText = 'Public';

  if (!isPublicChannel(channel)) {
    visibilityIcon = 'eye slash';
    visibilityColor = 'orange';
    visibilityText = 'Unlisted';
  }

  return <Segment padded style={{ backgroundColor: '#fff' }}>
    <div className='ChannelPreview'>

      <ChannelAvatar channel={channel} size='big' />

      <div className='ChannelDetails'>
        <h2 className='ChannelTitle'>
          <Link to={`/media/channels/${channel.id}`} style={{ marginRight: '1rem' }}>
            {channel.title}
          </Link>
          <Link to={`/media/channels/${channel.id}/edit`} className='ui button basic'>
            <i className='icon pencil' />
            Edit
          </Link>
        </h2>

        <p>{channel.description}</p>

        <Label basic color={visibilityColor} style={{ marginRight: '1rem' }}>
          <Icon name={visibilityIcon} />
          {visibilityText}
        </Label>

        {channel.curationStatus !== 'Normal' &&
          <Label basic color='red'>
            <Icon name='dont' />
            Channel {channel.curationStatus}
            {' '}<Icon name='question circle outline' size='small' />
          </Label>
        }
      </div>

      {/* // TODO uncomment when we calculate reward and count of videos in channel: */}
      {/* <ChannelStats channel={channel} /> */}

    </div>
  </Segment>
}

export function ChannelsByOwner (props: ChannelsByOwnerProps) {
  const { suspended = false, channels = [] } = props;

  return <div className='JoyChannels'>
    {!channels.length
      ? <YouHaveNoChannels suspended={suspended} />
      : <TabsAndChannels {...props} />
    }</div>;
}
