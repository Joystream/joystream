import React from 'react';
import { Button } from 'semantic-ui-react';

import { Pluralize } from '@polkadot/joy-utils/Pluralize';

export type MusicAlbumPreviewProps = {
  title: string,
  artist: string,
  cover: string,
  tracksCount: number
};

export function MusicAlbumPreview (props: MusicAlbumPreviewProps) {

  return <div className='JoyMusicAlbumPreview'>
    <div className='AlbumCover'>
      <img src={props.cover} />
    </div>
    <div className='AlbumDescription'>
      <h3 className='AlbumTitle'>{props.title}</h3>
      <div className='AlbumArtist'>{props.artist}</div>
      <div className='AlbumTracksCount'><Pluralize count={props.tracksCount} singularText='track' /></div>
    </div>
    <div className='AlbumActions'>
      <Button content='Edit' icon='pencil' />
      <Button content='Add track' icon='plus' />
    </div>
  </div>;
}

export type MyMusicAlbumsProps = {
  albums?: MusicAlbumPreviewProps[]
};

export function MyMusicAlbums (props: MyMusicAlbumsProps) {
  const { albums = [] } = props;
  const albumCount = albums && albums.length || 0;

  return <>
    <h2>{`My music albums (${albumCount})`}</h2>
    <div className='JoyTopActionBar'>
      <Button content='New album' icon='plus' />
    </div>
    <div className='JoyListOfPreviews'>
      {albumCount === 0
        ? <em className='NoItems'>You don't have music albums yet</em>
        : albums.map((album, i) =>
          <MusicAlbumPreview key={i} {...album} />
        )
      }
    </div>
  </>;
}
