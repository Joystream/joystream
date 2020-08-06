import React from 'react';
import { ChannelEntity } from '../entities/ChannelEntity';
import Section from '@polkadot/joy-utils/Section';
import { ChannelHeader } from './ChannelHeader';
import { MusicAlbumPreviewProps, MusicAlbumPreview } from '../music/MusicAlbumPreview';
import { MusicTrackReaderPreview, MusicTrackReaderPreviewProps } from '../music/MusicTrackReaderPreview';
import NoContentYet from '../common/NoContentYet';

type Props = {
  channel: ChannelEntity;
  albums?: MusicAlbumPreviewProps[];
  tracks?: MusicTrackReaderPreviewProps[];
};

function NoAlbums () {
  return <NoContentYet>Channel has no music albums yet.</NoContentYet>;
}

function NoTracks () {
  return <NoContentYet>Channel has no music tracks yet.</NoContentYet>;
}

export function ViewMusicChannel (props: Props) {
  const { channel, albums = [], tracks = [] } = props;

  const renderAlbumsSection = () => (
    !albums.length
      ? <NoAlbums />
      : <Section title={'Music albums'}>
        {albums.map(x => <MusicAlbumPreview key={x.id} {...x} />)}
      </Section>
  );

  const renderTracksSection = () => (
    !tracks.length
      ? <NoTracks />
      : <Section title={'Music tracks'}>
        {tracks.map(x => <MusicTrackReaderPreview key={x.id} {...x} />)}
      </Section>
  );

  return <div className='JoyViewChannel'>
    <ChannelHeader channel={channel} />
    {renderAlbumsSection()}
    {renderTracksSection()}
  </div>;
}
