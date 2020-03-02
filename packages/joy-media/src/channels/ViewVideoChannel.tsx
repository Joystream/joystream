import React from 'react';
import Section from '@polkadot/joy-utils/Section';
import { ChannelEntity } from '../entities/ChannelEntity';
import { ChannelHeader } from './ChannelHeader';
import { VideoPreview, VideoPreviewProps } from '../video/VideoPreview';
import NoContentYet from '../common/NoContentYet';

type Props = {
  channel: ChannelEntity,
  videos?: VideoPreviewProps[]
};

function NoVideosYet () {
  return <NoContentYet>Channel has no videos yet.</NoContentYet>
}

export function ViewVideoChannel (props: Props) {
  const { channel, videos = [] } = props;

  const renderVideosSection = () => (
    !videos.length
      ? <NoVideosYet />
      : <Section title={`Videos`}>
          {videos.map((x, i) =>
            <VideoPreview key={x.id.toString()} {...x} channel={channel} />)
          }
        </Section>
  );
  
  return <div className='JoyViewChannel'>
    <ChannelHeader channel={channel} />
    {renderVideosSection()}
  </div>
}
