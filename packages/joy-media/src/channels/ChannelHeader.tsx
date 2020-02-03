import React from 'react';
import { BgImg } from '../common/BgImg';
import { ChannelEntity } from '../entities/ChannelEntity';
import { ChannelPreview } from './ChannelPreview';

type Props = {
  channel: ChannelEntity
}

export function ChannelHeader (props: Props) {
  const { channel } = props;

  return (
    <div className='ChannelHeader'>
      <BgImg className='ChannelCover' url={channel.banner} />
      <ChannelPreview channel={channel} size='big' />
    </div>
  );
}
