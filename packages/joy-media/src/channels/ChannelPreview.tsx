import React from 'react';
import { ChannelEntity } from '../entities/ChannelEntity';
import { ChannelAvatar, ChannelAvatarSize } from './ChannelAvatar';

type Props = {
  channel: ChannelEntity,
  size?: ChannelAvatarSize
}

export function ChannelPreview (props: Props) {
  const { channel, size } = props;

  let subtitle: string | undefined;
  if (channel.content === 'music') {
    subtitle = 'Music channel'
  } else if (channel.content === 'video') {
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
