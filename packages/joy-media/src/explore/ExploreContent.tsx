import React from 'react';
import Section from '@polkadot/joy-utils/Section';
import { VideoPreviewProps, VideoPreview } from '../video/VideoPreview';
import { ChannelEntity } from '../entities/ChannelEntity';
import { ChannelPreview } from '../channels/ChannelPreview';

export type ExploreContentProps = {
  featuredVideos?: VideoPreviewProps[]
  latestVideos?: VideoPreviewProps[]
  latestVideoChannels?: ChannelEntity[]
};

export function ExploreContent (props: ExploreContentProps) {
  const { featuredVideos = [], latestVideos = [], latestVideoChannels = [] } = props;

  return <div>
    {featuredVideos.length > 0 &&
      <Section title={`Featured videos`} className='ListOfVideos'>
        {featuredVideos.map((x) =>
          <VideoPreview key={x.id} {...x} />
        )}
      </Section>
    }
    {latestVideos.length > 0 &&
      // Add a link to "View all videos"
      <Section title={`Latest videos`} className='ListOfVideos'>
        {latestVideos.map((x) =>
          <VideoPreview key={x.id} {...x} />
        )}
      </Section>
    }
    {latestVideoChannels.length > 0 &&
      // Add a link to "View all channels"
      <Section title={`Latest video channels`} className='ListOfChannels'>
        {latestVideoChannels.map((x) =>
          <ChannelPreview key={x.id} channel={x} withSubtitle={false} />
        )}
      </Section>
    }
  </div>
}
