import React, { useState } from 'react';
import { Segment, Statistic, Icon, Label, SemanticICONS, SemanticCOLORS, Button, Tab } from 'semantic-ui-react';
import { ChannelEntity } from '../entities/MusicChannelEntity';
import { YouHaveNoChannels } from './YouHaveNoChannels';
import Section from '@polkadot/joy-utils/Section';
import { formatNumber } from '@polkadot/util';
import { ChannelAvatar } from './ChannelAvatar';

type Props = {
  suspended?: boolean,
  channels?: ChannelEntity[]
};

const TabsAndChannels = (props: Props) => {
  const { channels: allChannels = [] } = props;
  const [ channels, setChannels ] = useState(allChannels);

  let videoChannelsCount = 0;
  let musicChannelsCount = 0;
  allChannels.forEach(x => {
    if (x.contentType === 'video') {
      videoChannelsCount++;
    } else if (x.contentType === 'music') {
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
        x => x.contentType === activeContentType)
      )
    }
  }

  return <>
    <Tab
      panes={panes}
      menu={{ secondary: true }}
      style={{ display: 'inline-flex', margin: '1rem 2rem 1rem 0' }}
      onTabChange={(_e, data) => switchTab(data.activeIndex as number)}
    />
    <Button color='blue' icon='plus' content='Create Channel' />
    {channels.map(x => <ChannelPreview channel={x} />)}
  </>
}

type ChannelPreviewProps = {
  channel: ChannelEntity
};

const ChannelPreview = (props: ChannelPreviewProps) => {
  const { channel } = props;

  const statSize = 'tiny';

  let itemsPublishedLabel = ''
  if (channel.contentType === 'video') {
    itemsPublishedLabel = 'Videos'
  } else if (channel.contentType === 'music') {
    itemsPublishedLabel = 'Music tracks'
  }

  let visibilityIcon: SemanticICONS = 'eye';
  let visibilityColor: SemanticCOLORS = 'green';
  if (channel.visibility === 'Unlisted') {
    visibilityIcon = 'eye slash';
    visibilityColor = 'orange'
  }

  return <Segment padded>
    <div className='ChannelPreview'>

      <ChannelAvatar channel={channel} size='big' />

      <div className='ChannelDetails'>
        <h2 className='ChannelTitle'>{channel.title}</h2>
        <p>{channel.description}</p>

        <Label basic size='large' color={visibilityColor} style={{ marginRight: '1rem' }}>
          <Icon name={visibilityIcon} />
          {channel.visibility}
        </Label>

        {channel.blocked && <Label basic size='large' color='red'>
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

export function MyChannels (props: Props) {
  const { suspended = false, channels = [] } = props;

  return <Section title='My Channels' className='JoyChannels'>
    {!channels.length
      ? <YouHaveNoChannels suspended={suspended} />
      : <TabsAndChannels {...props} />
    }</Section>;
}
