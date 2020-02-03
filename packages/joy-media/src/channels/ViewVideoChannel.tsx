import React from 'react';
import Section from '@polkadot/joy-utils/Section';
import { ChannelEntity } from '../entities/ChannelEntity';
import { ChannelHeader } from './ChannelHeader';
import { VideoPreview, VideoPreviewProps } from '../video/VideoPreview';

type Props = {
  channel: ChannelEntity,
  videos?: VideoPreviewProps[]
};

function NoTracks () {
  return null
}

export function ViewVideoChannel (props: Props) {
  const { channel, videos = [] } = props;

  const renderVideosSection = () => (
    !videos.length
      ? <NoTracks />
      : <Section title={`Videos`}>
          {videos.map((x, i) => <VideoPreview key={'VideoPreview-' + i} {...x} />)}
        </Section>
  );
  
  return <div className='JoyViewChannel'>
    <ChannelHeader channel={channel} />
    {renderVideosSection()}
  </div>
}
