import React from 'react';
import Section from '@polkadot/joy-utils/Section';
import { VideoPreviewProps, VideoPreview } from '../video/VideoPreview';
import { ChannelEntity } from '../entities/ChannelEntity';
import { ChannelPreview } from '../channels/ChannelPreview';

export type ExploreContentProps = {
  latestVideos?: VideoPreviewProps[],
  latestVideoChannels?: ChannelEntity[],
};

export function ExploreContent (props: ExploreContentProps) {
  const { latestVideos = [], latestVideoChannels = [] } = props;

  // TODO show pagination for latest videos

  // TODO show pagination for latest channels

  return <div>
    {latestVideos.length > 0 &&
      <Section title={`Latest videos`} className='ListOfVideos'>
        {latestVideos.map((x) =>
          <VideoPreview key={x.id} {...x} />
        )}
      </Section>
    }
    {latestVideoChannels.length > 0 &&
      <Section title={`Latest video channels`} className='ListOfChannels'>
        {latestVideoChannels.map((x) =>
          <ChannelPreview key={x.id} channel={x} withSubtitle={false} />
        )}
      </Section>
    }
  </div>
}
