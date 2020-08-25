import React from 'react';
import { RouteComponentProps } from 'react-router';
import { MediaView } from '../MediaView';
import { PlayVideoProps, PlayVideo } from './PlayVideo';
import { JoyError } from '@polkadot/joy-utils/react/components';
import { useApi } from '@polkadot/react-hooks';

type Props = PlayVideoProps;

export const PlayVideoView = MediaView<Props>({
  component: PlayVideo,
  triggers: ['id'],
  resolveProps: async (props) => {
    const { transport, api, id } = props;

    const video = await transport.videoById(id);

    if (!video) return {};

    const channelId = api.createType('ChannelId', video.channelId);
    const channel = await transport.channelById(channelId);
    const moreChannelVideos = (await transport.videosByChannelId(channelId, 5, (x) => x.id !== video.id));
    const featuredVideos = await transport.featuredVideos();
    const mediaObject = video.object;

    return { channel, mediaObject, video, moreChannelVideos, featuredVideos };
  }
});

export const PlayVideoWithRouter = (props: Props & RouteComponentProps<any>) => {
  const { match: { params: { id } } } = props;
  const { api } = useApi();

  if (id) {
    try {
      return <PlayVideoView {...props} id={api.createType('EntityId', id)} />;
    } catch (err) {
      console.log('PlayVideoWithRouter failed:', err);
    }
  }

  return <JoyError title={'Invalid video id in URL'}>{id}</JoyError>;
};
