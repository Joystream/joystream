import React from 'react';
import { Link } from 'react-router-dom';
import { ChannelEntity } from '../entities/ChannelEntity';
import { ChannelAvatar, ChannelAvatarSize } from './ChannelAvatar';
import { isMusicChannel, isVideoChannel } from './ChannelHelpers';

type Props = {
  channel: ChannelEntity,
  size?: ChannelAvatarSize
}

export function ChannelPreview (props: Props) {
  const { channel, size } = props;

  let subtitle: string | undefined;
  let icon: 'music' | 'film' | undefined;

  if (isMusicChannel(channel)) {
    subtitle = 'Music channel',
    icon = 'music'
  } else if (isVideoChannel(channel)) {
    subtitle = 'Video channel'
    icon = 'film'
  }

  return (
    <div className={`ChannelPreview ` + (size ? size : '')}>
      <ChannelAvatar channel={channel} size={size} />
      <div>
        <Link to={`/media/channels/${channel.id}`}>
          <h2 className='ChannelTitle'>{channel.title}</h2>
        </Link>
        {subtitle &&
          <div className='ChannelSubtitle'>
            {icon && <i className={`icon ${icon}`} />}
            {subtitle}
          </div>}
      </div>
    </div>
  );
}
