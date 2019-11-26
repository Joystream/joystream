import React from 'react';
import { ChannelEntity } from '../entities/MusicChannelEntity';
import { MusicTrackEntity } from '../entities/MusicTrackEntity';
import Section from '@polkadot/joy-utils/Section';
import { ChannelHeader } from './ChannelHeader';
import { MusicAlbumPreviewProps, MusicAlbumPreview } from '../music/MusicAlbumPreview';

type Props = {
  channel: ChannelEntity,
  albums?: MusicAlbumPreviewProps[],
  tracks?: MusicTrackEntity[]
};

function NoAlbums () {
  return null
}

function NoTracks () {
  return null
}

export function ViewMusicChannel (props: Props) {
  const { channel, albums = [], tracks = [] } = props;
  
  const renderAlbumsSection = () => (
    !albums.length
      ? <NoAlbums />
      : <Section title={`Music albums`}>
          {albums.map(album => <MusicAlbumPreview {...album} />)}
        </Section>
  );

  const renderTracksSection = () => (
    !tracks.length
      ? <NoTracks />
      : <Section title={`Music tracks`}>TODO render tracks</Section>
  );
  
  return <div className='JoyViewChannel'>
    <ChannelHeader channel={channel} />
    {renderAlbumsSection()}
    {renderTracksSection()}
  </div>
}
