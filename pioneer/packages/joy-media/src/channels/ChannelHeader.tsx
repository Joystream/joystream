import React from 'react';
import { BgImg } from '../common/BgImg';
import { ChannelEntity } from '../entities/ChannelEntity';
import { ChannelPreview } from './ChannelPreview';

type Props = {
  channel: ChannelEntity
}

export function ChannelHeader (props: Props) {
  const { channel } = props;
  const { banner } = channel;

  return (
    <div className='ChannelHeader'>
      {banner && <BgImg className='ChannelCover' url={banner} />}
      <ChannelPreview channel={channel} size='big' withDescription />
    </div>
  );
}
