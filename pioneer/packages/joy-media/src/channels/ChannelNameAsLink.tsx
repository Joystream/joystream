import React from 'react';
import { Link } from 'react-router-dom';
import { ChannelEntity } from '../entities/ChannelEntity';

type Props = {
  channel: ChannelEntity;
  className?: string;
  style?: React.CSSProperties;
}

export const ChannelNameAsLink = (props: Props) => {
  const { channel, className, style } = props;
  return (
    <Link to={`/media/channels/${channel.id}`} className={className} style={style}>
      {channel.title || channel.handle}
    </Link>
  );
};
