import React from 'react';
import { Link } from 'react-router-dom';
import Section from '@polkadot/joy-utils/Section';
import { VideoPreviewProps, VideoPreview } from '../video/VideoPreview';
import { ChannelEntity } from '../entities/ChannelEntity';
import { ChannelPreview } from '../channels/ChannelPreview';

const LatestVideosTitle = () => (
  <div>
    Latest videos
    <Link to={'/media/videos'} className='ViewAllLink'>All videos</Link>
  </div>
);

const LatestChannelsTitle = () => (
  <div>
    Latest video channels
    <Link to={'/media/channels'} className='ViewAllLink'>All channels</Link>
  </div>
);

export type ExploreContentProps = {
  featuredVideos?: VideoPreviewProps[];
  latestVideos?: VideoPreviewProps[];
  latestVideoChannels?: ChannelEntity[];
}

export function ExploreContent (props: ExploreContentProps) {
  const { featuredVideos = [], latestVideos = [], latestVideoChannels = [] } = props;

  return <div>
    {featuredVideos.length > 0 &&
      <Section title={'Featured videos'} className='ListOfVideos'>
        {featuredVideos.map((x) =>
          <VideoPreview key={x.id} {...x} withChannel />
        )}
      </Section>
    }
    {latestVideos.length > 0 &&
      <Section className='ListOfVideos' title={<LatestVideosTitle />}>
        {latestVideos.map((x) =>
          <VideoPreview key={x.id} {...x} withChannel />
        )}
      </Section>
    }
    {latestVideoChannels.length > 0 &&
      <Section className='ListOfChannels' title={<LatestChannelsTitle />}>
        {latestVideoChannels.map((x) =>
          <ChannelPreview key={x.id} channel={x} withSubtitle={false} />
        )}
      </Section>
    }
  </div>;
}
