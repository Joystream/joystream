import React from 'react';
import Section from '@polkadot/joy-utils/Section';
import { MusicAlbumPreviewProps, MusicAlbumPreview } from '../music/MusicAlbumPreview';

type Props = {
  featuredAlbums?: MusicAlbumPreviewProps[],
  latestAlbums?: MusicAlbumPreviewProps[],
};

export function ExploreContent (props: Props) {
  const { featuredAlbums = [], latestAlbums = [] } = props;

  return <div>
    {featuredAlbums.length > 0 &&
      <Section title={`Featured albums`}>
        {featuredAlbums.map(x => <MusicAlbumPreview {...x} size={300} />)}
      </Section>
    }
    {latestAlbums.length > 0 &&
      <Section title={`Latest albums`}>
        {latestAlbums.map(x => <MusicAlbumPreview {...x} size={170} />)}
      </Section>
    }
  </div>
}
