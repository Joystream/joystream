import React from 'react';
import { Button } from 'semantic-ui-react';

import { MusicAlbumPreviewProps, MusicAlbumPreview } from './MyMusicAlbums';

export type MusicTrackPreviewProps = {
  title: string,
  artist: string,
  cover: string,
  position?: number,
};

export function MusicTrackPreview (props: MusicTrackPreviewProps) {

  return <div className='JoyMusicTrackPreview'>
    {props.position && <div className='AlbumNumber'>{props.position}</div>}
    <div className='AlbumCover'>
      <img src={props.cover} />
    </div>
    <div className='AlbumDescription'>
      <h3 className='AlbumTitle'>{props.title}</h3>
      <div className='AlbumArtist'>{props.artist}</div>
    </div>
    <div className='AlbumActions'>
      <Button content='Edit' icon='pencil' />
      <Button content='Remove from album' icon='minus' />
    </div>
  </div>;
}

export type TracksOfMyMusicAlbumProps = {
  album: MusicAlbumPreviewProps,
  tracks?: MusicTrackPreviewProps[]
};

export function TracksOfMyMusicAlbum (props: TracksOfMyMusicAlbumProps) {
  const { album, tracks = [] } = props;
  const tracksCount = tracks && tracks.length || 0;

  return <>
    <MusicAlbumPreview {...album} tracksCount={tracksCount} />
    <div className='JoyMusicAlbumActionBar'>
      <Button content='Add track' icon='plus' />
      {tracksCount > 0 && <Button content='Remove from album' icon='minus' />}
    </div>
    <div className='JoyListOfPreviews'>
      {tracksCount === 0
        ? <em>This album has no tracks yet</em>
        : tracks.map((track, i) =>
          <MusicTrackPreview key={i} {...track} position={i + 1} />
        )
      }
    </div>
  </>;
}
