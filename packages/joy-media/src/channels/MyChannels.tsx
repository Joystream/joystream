import React from 'react';
import { Button, Segment, Statistic, Message, Icon, Label, SemanticICONS, SemanticCOLORS } from 'semantic-ui-react';
import { ChannelEntity } from '../entities/MusicChannelEntity';
import { YouHaveNoChannels } from './YouHaveNoChannels';
import Section from '@polkadot/joy-utils/Section';
import { onImageError } from '../utils';
import { formatNumber } from '@polkadot/util';

type Props = {
  suspended?: boolean,
  channels?: ChannelEntity[]
};

export function MyChannels (props: Props) {
  const { suspended = false, channels = [] } = props;

  const renderChannelPreview = (channel: ChannelEntity) => {
    const avatarStyle = {
      backgroundImage: `url(${channel.avatarUrl})`
    }

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
        <div className='ChannelAvatar' style={avatarStyle} />

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

  return <Section title='My Channels' className='JoyChannels'>
    {!channels.length
      ? <YouHaveNoChannels suspended={suspended} />
      : channels.map(renderChannelPreview)
    }</Section>;
}