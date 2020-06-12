import React from 'react';
import { Button } from 'semantic-ui-react';
import { MusicAlbumPreviewProps, MusicAlbumPreview } from './MusicAlbumPreview';

export type MyMusicAlbumsProps = {
  albums?: MusicAlbumPreviewProps[];
};

export function MyMusicAlbums (props: MyMusicAlbumsProps) {
  const { albums = [] } = props;
  const albumCount = (albums && albums.length) || 0;

  return <>
    <h2>{`My music albums (${albumCount})`}</h2>
    <div className='JoyTopActionBar'>
      <Button content='New album' icon='plus' />
    </div>
    <div>
      {albumCount === 0
        ? <em className='NoItems'>{'You don\'t have music albums yet'}</em>
        : albums.map((album, i) =>
          <MusicAlbumPreview key={i} {...album} />
        )
      }
    </div>
  </>;
}
