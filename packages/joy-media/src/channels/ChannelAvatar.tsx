import React from 'react';
import { ChannelEntity } from '../entities/MusicChannelEntity';
import { BgImg } from '../common/BgImg';

type Props = {
  channel: ChannelEntity
}

export function ChannelAvatar (props: Props) {
  return <BgImg className='ChannelAvatar' url={props.channel.avatarUrl} />
}