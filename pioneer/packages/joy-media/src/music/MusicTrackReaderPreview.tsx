import React, { CSSProperties } from 'react';
import { BgImg } from '../common/BgImg';

export type MusicTrackReaderPreviewProps = {
  id: string,
  title: string,
  artist: string,
  thumbnail: string,
  size?: number,
  orientation?: 'vertical' | 'horizontal',
};

export function MusicTrackReaderPreview (props: MusicTrackReaderPreviewProps) {
  const { size = 200, orientation = 'vertical' } = props;

  let descStyle: CSSProperties = {};
  if (orientation === 'vertical') {
    descStyle.maxWidth = size;
  }

  return <div className={`JoyMusicAlbumPreview ` + orientation}>

    <BgImg className='AlbumCover' url={props.thumbnail} size={size} />

    <div className='AlbumDescription' style={descStyle}>
      <h3 className='AlbumTitle'>{props.title}</h3>
      <div className='AlbumArtist'>{props.artist}</div>
    </div>
  </div>;
}
