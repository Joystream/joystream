import React from 'react';
import { Button } from 'semantic-ui-react';
import { Pluralize } from '@polkadot/joy-utils/Pluralize';
import { BgImg } from '../common/BgImg';

export type MusicAlbumPreviewProps = {
  id: string,
  title: string,
  artist: string,
  cover: string,
  tracksCount: number,
  withActions?: boolean
};

export function MusicAlbumPreview (props: MusicAlbumPreviewProps) {
  return <div className='JoyMusicAlbumPreview'>
  
    <BgImg className='AlbumCover' url={props.cover} />

    <div className='AlbumDescription'>
      <h3 className='AlbumTitle'>{props.title}</h3>
      <div className='AlbumArtist'>{props.artist}</div>
      <div className='AlbumTracksCount'><Pluralize count={props.tracksCount} singularText='track' /></div>
    </div>

    {props.withActions && <div className='AlbumActions'>
      <Button content='Edit' icon='pencil' />
      <Button content='Add track' icon='plus' />
    </div>}
  </div>;
}
