import React from 'react';
import { Link } from 'react-router-dom';
import { ChannelEntity } from '../entities/ChannelEntity';
import { BgImg } from '../common/BgImg';
import { DEFAULT_THUMBNAIL_URL } from '../utils';

const defaultSizePx = 75;

export type ChannelAvatarSize = 'big' | 'default' | 'small';

type Props = {
  channel: ChannelEntity,
  size?: ChannelAvatarSize
}

function sizeToPx (size: ChannelAvatarSize): number {
  switch (size) {
    case 'big': return 100;
    case 'small': return 35;
    case 'default': return defaultSizePx;
    default: return defaultSizePx;
  }
}

export function ChannelAvatar (props: Props) {
  const { channel, size = 'default' } = props;

  return (
    <Link to={`/media/channels/${channel.id}`}>
      <BgImg
        className={`ChannelAvatar ` + size}
        url={channel.avatar || DEFAULT_THUMBNAIL_URL}
        size={sizeToPx(size)}
      />
    </Link>
  )
}