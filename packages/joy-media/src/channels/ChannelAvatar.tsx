import React from 'react';
import { ChannelEntity } from '../entities/MusicChannelEntity';
import { BgImg } from '../common/BgImg';

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

  return <BgImg
    className={`ChannelAvatar ` + size}
    url={channel.avatarUrl}
    size={sizeToPx(size)}
  />
}