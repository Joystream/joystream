import React from 'react';
import { BgImg } from '../common/BgImg';

export type MusicTrackReaderPreviewProps = {
  id: string,
  title: string,
  artist: string,
  cover: string
};

export function MusicTrackReaderPreview (props: MusicTrackReaderPreviewProps) {
  return <div className='JoyMusicAlbumPreview'>
  
    <BgImg className='AlbumCover' url={props.cover} />

    <div className='AlbumDescription'>
      <h3 className='AlbumTitle'>{props.title}</h3>
      <div className='AlbumArtist'>{props.artist}</div>
    </div>
  </div>;
}
