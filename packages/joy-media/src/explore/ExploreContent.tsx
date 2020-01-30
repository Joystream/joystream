import React from 'react';
import Section from '@polkadot/joy-utils/Section';
import { MusicAlbumPreviewProps, MusicAlbumPreview } from '../music/MusicAlbumPreview';

export type ExploreContentProps = {
  featuredAlbums?: MusicAlbumPreviewProps[],
  latestAlbums?: MusicAlbumPreviewProps[],
};

export function ExploreContent (props: ExploreContentProps) {
  const { featuredAlbums = [], latestAlbums = [] } = props;

  // TODO show featured videos
  
  // TODO show latest videos

  // TODO show pagination for latest videos

  return <div>
    {featuredAlbums.length > 0 &&
      <Section title={`Featured albums`}>
        {featuredAlbums.map((x, i) => <MusicAlbumPreview key={'featured-album-' + i} {...x} size={300} />)}
      </Section>
    }
    {latestAlbums.length > 0 &&
      <Section title={`Latest albums`}>
        {latestAlbums.map((x, i) => <MusicAlbumPreview key={'latest-album-' + i} {...x} size={170} />)}
      </Section>
    }
  </div>
}
