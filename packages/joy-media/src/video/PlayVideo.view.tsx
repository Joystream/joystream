import React from 'react';
import { RouteComponentProps } from 'react-router';
import { MediaView } from '../MediaView';
import { PlayVideoProps, PlayVideo } from './PlayVideo';
import { ChannelId } from '@joystream/types/content-working-group';
import { EntityId } from '@joystream/types/versioned-store';

type Props = PlayVideoProps;

export const PlayVideoView = MediaView<Props>({
  component: PlayVideo,
  triggers: [ 'id' ],
  resolveProps: async (props) => {
    const { transport, id } = props

    const video = await transport.videoById(id)
    if (!video) return {}

    const channelId = new ChannelId(video.channelId)
    const channel = await transport.channelById(channelId)
    const moreChannelVideos = (await transport.videosByChannelId(channelId, 5)).filter(x => x.id !== video.id)
    const featuredVideos = await transport.featuredVideos()
    const mediaObject = video.object

    return { channel, mediaObject, video, moreChannelVideos, featuredVideos }
  }
});

export const PlayVideoWithRouter = (props: Props & RouteComponentProps<any>) => {
  const { match: { params: { id }}} = props;

  if (id) {
    try {
      return <PlayVideoView {...props} id={new EntityId(id)} />
    } catch (err) {
      console.log('PlayVideoWithRouter failed:', err);
    }
  }

  return <em>ERROR: Invalid video id in URL: ${id}</em>;
}
