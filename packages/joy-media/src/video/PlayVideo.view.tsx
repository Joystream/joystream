import React from 'react';
import { RouteComponentProps } from 'react-router';
import { MediaView } from '../MediaView';
import { PlayVideoProps, PlayVideo } from './PlayVideo';
import { ChannelId } from '@joystream/types/content-working-group';
import { EntityId } from '@joystream/types/versioned-store';

type Props = PlayVideoProps;

export const PlayVideoView = MediaView<Props>({
  component: PlayVideo,
  resolveProps: async (props) => {
    const { transport, id } = props

    const video = await transport.videoById(id)
    if (!video) return {}

    const channelId = new ChannelId(video.channelId)
    const channel = await transport.channelById(channelId)
    const featuredVideos = await transport.featuredVideos()

    // TODO Fix this type-casting hack.
    // Video.object field should be either number on the Video type
    // or there should be a way to get to video.object.id,
    // but for this we need to load all fileds internally refered by video?
    // This doesn'r sound as the best approach.
    const objectId = new EntityId((video.object || 0) as number)

    const mediaObject = await transport.mediaObjectById(objectId)

    return { mediaObject, video, channel, featuredVideos }
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
