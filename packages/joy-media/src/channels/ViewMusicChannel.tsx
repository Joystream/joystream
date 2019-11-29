import React from 'react';
import { ChannelEntity } from '../entities/MusicChannelEntity';
import Section from '@polkadot/joy-utils/Section';
import { ChannelHeader } from './ChannelHeader';
import { MusicAlbumPreviewProps, MusicAlbumPreview } from '../music/MusicAlbumPreview';
import { MusicTrackReaderPreview, MusicTrackReaderPreviewProps } from '../music/MusicTrackReaderPreview';

type Props = {
  channel: ChannelEntity,
  albums?: MusicAlbumPreviewProps[],
  tracks?: MusicTrackReaderPreviewProps[]
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
          {albums.map(x => <MusicAlbumPreview {...x} />)}
        </Section>
  );

  const renderTracksSection = () => (
    !tracks.length
      ? <NoTracks />
      : <Section title={`Music tracks`}>
          {tracks.map(x => <MusicTrackReaderPreview {...x} />)}
        </Section>
  );
  
  return <div className='JoyViewChannel'>
    <ChannelHeader channel={channel} />
    {renderAlbumsSection()}
    {renderTracksSection()}
  </div>
}
