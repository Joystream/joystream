import React from 'react';
import { ChannelEntity } from '../entities/MusicChannelEntity';
import { ChannelAvatar } from './ChannelAvatar';
import { BgImg } from '../common/BgImg';

type ChannelHeaderProps = {
  channel: ChannelEntity
}

export function ChannelHeader (props: ChannelHeaderProps) {
  const { channel } = props;

  let subtitle: string | undefined;
  if (channel.contentType === 'music') {
    subtitle = 'Music channel'
  } else if (channel.contentType === 'video') {
    subtitle = 'Video channel'
  }

  return (
    <div className='ChannelHeader'>
      <BgImg className='ChannelCover' url={channel.coverUrl} />

      <div style={{ display: 'flex' }}>
        <ChannelAvatar channel={channel} />
        <div>
          <h2 className='ChannelTitle'>{channel.title}</h2>
          {subtitle && <div className='ChannelSubtitle'>{subtitle}</div>}
        </div>
      </div>
    </div>
  );
}
