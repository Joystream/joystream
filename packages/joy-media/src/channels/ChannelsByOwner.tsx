import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Segment, Statistic, Icon, Label, SemanticICONS, SemanticCOLORS, Tab } from 'semantic-ui-react';
import { ChannelEntity } from '../entities/ChannelEntity';
import { YouHaveNoChannels } from './YouHaveNoChannels';
import { formatNumber } from '@polkadot/util';
import { ChannelAvatar } from './ChannelAvatar';
import { MemberId } from '@joystream/types/members';

// TODO Add component ChannelsByOwner

export type ChannelsByOwnerProps = {
  memberId: MemberId,
  suspended?: boolean,
  channels?: ChannelEntity[]
};

const TabsAndChannels = (props: ChannelsByOwnerProps) => {
  const { channels: allChannels = [] } = props;
  const [ channels, setChannels ] = useState(allChannels);

  let videoChannelsCount = 0;
  let musicChannelsCount = 0;
  allChannels.forEach(x => {
    if (x.content === 'video') {
      videoChannelsCount++;
    } else if (x.content === 'music') {
      musicChannelsCount++;
    }
  });

  const panes = [
    { menuItem: `All (${allChannels.length})` },
    { menuItem: `Video (${videoChannelsCount})` },
    { menuItem: `Music (${musicChannelsCount})` }
  ];

  const contentTypeByTabIndex = [ undefined, 'video', 'music' ];

  const switchTab = (activeIndex: number) => {
    const activeContentType = contentTypeByTabIndex[activeIndex];
    if (activeContentType === undefined) {
      setChannels(allChannels)
    } else {
      setChannels(allChannels.filter(
        x => x.content === activeContentType)
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

  const statSize = 'tiny';

  let itemsPublishedLabel = ''
  if (channel.content === 'video') {
    itemsPublishedLabel = 'Videos'
  } else if (channel.content === 'music') {
    itemsPublishedLabel = 'Music tracks'
  }

  let visibilityIcon: SemanticICONS = 'eye';
  let visibilityColor: SemanticCOLORS = 'green';
  if (channel.visibility === 'Unlisted') {
    visibilityIcon = 'eye slash';
    visibilityColor = 'orange'
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
          {channel.visibility}
        </Label>

        {channel.blocked && <Label basic color='red'>
          <Icon name='dont' />
          Channel blocked
          {' '}<Icon name='question circle outline' size='small' />
        </Label>}
      </div>

      <div className='ChannelStats'>
        <div>
          <Statistic size={statSize}>
            <Statistic.Label>Reward earned</Statistic.Label>
            <Statistic.Value>
              {formatNumber(channel.rewardEarned)}
              &nbsp;<span style={{ fontSize: '1.5rem' }}>JOY</span>
            </Statistic.Value>
          </Statistic>
        </div>

        <div style={{ marginTop: '1rem' }}>
          <Statistic size={statSize}>
            <Statistic.Label>{itemsPublishedLabel}</Statistic.Label>
            <Statistic.Value>{formatNumber(channel.contentItemsCount)}</Statistic.Value>
          </Statistic>
        </div>
      </div>
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
