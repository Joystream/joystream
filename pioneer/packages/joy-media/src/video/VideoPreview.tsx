import React, { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { BgImg } from '../common/BgImg';
import { VideoType } from '../schemas/video/Video';
import { useMyMembership } from '@polkadot/joy-utils/MyMembershipContext';
import { ChannelEntity } from '../entities/ChannelEntity';
import { isAccountAChannelOwner } from '../channels/ChannelHelpers';
import { ChannelAvatarAndName } from '../channels/ChannelAvatarAndName';

export type VideoPreviewProps = {
  id: number;
  title: string;
  thumbnail: string;

  channel?: ChannelEntity;
  withChannel?: boolean;

  // Preview-specific props:
  size?: 'normal' | 'small';
  orientation?: 'vertical' | 'horizontal';
};

export function VideoPreview (props: VideoPreviewProps) {
  const { myAccountId } = useMyMembership();
  const { id, channel, withChannel = false, title, size = 'normal', orientation = 'vertical' } = props;

  let width = 210;
  let height = 118;

  if (size === 'small') {
    width = 168;
    height = 94;
  }

  const descStyle: CSSProperties = {
    maxWidth: orientation === 'vertical'
      ? width
      : width * 1.5
  };

  const playbackUrl = `/media/videos/${id}`;
  const iAmOwner = isAccountAChannelOwner(channel, myAccountId);

  return (
    <div className={'JoyMusicAlbumPreview ' + orientation}>

      <Link to={playbackUrl}>
        <BgImg
          url={props.thumbnail}
          className='AlbumCover'
          width={width}
          height={height}
        />
      </Link>

      <div className='AlbumDescription' style={descStyle}>

        <Link to={playbackUrl}>
          <h3 className='AlbumTitle' title={title}>{title}</h3>
        </Link>

        {withChannel && channel &&
          <ChannelAvatarAndName channel={channel} />
        }

        {iAmOwner &&
          <div>
            <Link to={`/media/videos/${id}/edit`} className='ui button basic small'>
              <i className='icon pencil' />
              Edit
            </Link>
          </div>
        }
      </div>
    </div>
  );
}

export function toVideoPreviews (items: VideoType[]): VideoPreviewProps[] {
  return items.map(x => ({
    id: x.id,
    title: x.title,
    thumbnail: x.thumbnail
  }));
}
