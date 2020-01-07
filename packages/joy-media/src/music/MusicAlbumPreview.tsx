import React from 'react';
import { Button } from 'semantic-ui-react';
import { Pluralize } from '@polkadot/joy-utils/Pluralize';
import { BgImg } from '../common/BgImg';
import { ChannelEntity } from '../entities/MusicChannelEntity';

export type MusicAlbumPreviewProps = {
  id: string,
  title: string,
  artist: string,
  cover: string,
  tracksCount: number,

  // Extra props:
  channel?: ChannelEntity,
  size?: number,
  withActions?: boolean
};

export function MusicAlbumPreview (props: MusicAlbumPreviewProps) {
  const { size = 200 } = props;

  // TODO show the channel this album belongs to.

  return <div className='JoyMusicAlbumPreview'>
  
    <BgImg className='AlbumCover' url={props.cover} size={size} />

    <div className='AlbumDescription' style={{ maxWidth: size }}>
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
