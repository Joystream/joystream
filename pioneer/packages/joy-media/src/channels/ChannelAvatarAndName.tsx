import React from 'react';
import { ChannelEntity } from '../entities/ChannelEntity';
import { ChannelAvatar } from './ChannelAvatar';
import { ChannelNameAsLink } from './ChannelNameAsLink';

type Props = {
  channel: ChannelEntity
}

export const ChannelAvatarAndName = (props: Props) => {
  const { channel } = props;
  return (
    <div className={`ChannelPreview small`}>
      <ChannelAvatar channel={channel} size='small' />
      <div className='ChannelDetails'>
        <h3 className='ChannelTitle' style={{ display: 'block' }}>
          <ChannelNameAsLink channel={channel} />
        </h3>
      </div>
    </div>
  )
}
