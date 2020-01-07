import React from 'react';
import { ChannelEntity } from '../entities/MusicChannelEntity';
import { ChannelAvatar, ChannelAvatarSize } from './ChannelAvatar';

type Props = {
  channel: ChannelEntity,
  size?: ChannelAvatarSize
}

export function ChannelPreview (props: Props) {
  const { channel, size } = props;

  let subtitle: string | undefined;
  if (channel.contentType === 'music') {
    subtitle = 'Music channel'
  } else if (channel.contentType === 'video') {
    subtitle = 'Video channel'
  }

  return (
    <div className={`ChannelPreview ` + (size ? size : '')}>
      <ChannelAvatar channel={channel} size={size} />
      <div>
        <h2 className='ChannelTitle'>{channel.title}</h2>
        {subtitle && <div className='ChannelSubtitle'>{subtitle}</div>}
      </div>
    </div>
  );
}
