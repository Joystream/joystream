import React from 'react';
import Section from '@polkadot/joy-utils/Section';
import { VideoPreviewProps, VideoPreview } from '../video/VideoPreview';
import { MediaView } from '../MediaView';

export type Props = {
  videos?: VideoPreviewProps[];
}

export function AllVideos (props: Props) {
  const { videos = [] } = props;

  return videos.length === 0
    ? <em>No videos found</em>
    : <Section title={`All videos (${videos.length})`} className='ListOfVideos'>
      {videos.map((x) =>
        <VideoPreview key={x.id} {...x} withChannel />
      )}
    </Section>;
}

export const AllVideosView = MediaView<Props>({
  component: AllVideos,
  resolveProps: async ({ transport }) => ({
    videos: await transport.allPublicVideos()
  })
});
