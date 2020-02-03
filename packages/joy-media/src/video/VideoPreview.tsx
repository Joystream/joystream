import React, { CSSProperties } from 'react';
import { BgImg } from '../common/BgImg';
import { VideoType } from '../schemas/video/Video';

export type VideoPreviewProps = {
  id: number,
  title: string,
  thumbnail: string,

  // Preview-specific props:
  size?: number,
  orientation?: 'vertical' | 'horizontal',
};

export function VideoPreview (props: VideoPreviewProps) {
  const { size = 200, orientation = 'vertical' } = props;

  let descStyle: CSSProperties = {};
  if (orientation === 'vertical') {
    descStyle.maxWidth = size;
  }

  return (
    <div className={`JoyMusicAlbumPreview ` + orientation}>
      <BgImg className='AlbumCover' url={props.thumbnail} size={size} />
      <div className='AlbumDescription' style={descStyle}>
        <h3 className='AlbumTitle'>{props.title}</h3>
      </div>
    </div>
  );
}

export function toVideoPreviews(items: VideoType[]): VideoPreviewProps[] {
  return items.map(x => ({
    id: x.id,
    title: x.title,
    thumbnail: x.thumbnail,
  }));
}
