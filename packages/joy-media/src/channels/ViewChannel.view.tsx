import React from 'react';
import { RouteComponentProps } from 'react-router';
import { MediaView } from '../MediaView';
import { ViewChannelProps, ViewChannel } from './ViewChannel';
import { ChannelId } from '@joystream/types/content-working-group';

type Props = ViewChannelProps;

export const ViewChannelView = MediaView<Props>({
  component: ViewChannel,
  resolveProps: async (props) => {
    const { transport, id } = props;
    const channel = await transport.channelById(id);
    
    // TODO check if video content, else if music content.

    const videos = await transport.videosByChannelId(id);
    return { channel, videos };
  }
});

export const ViewChannelWithRouter = (props: Props & RouteComponentProps<any>) => {
  const { match: { params: { id }}} = props;

  if (id) {
    try {
      return <ViewChannelView {...props} id={new ChannelId(id)} />;
    } catch (err) {
      console.log('ViewChannelWithRouter failed:', err);
    }
  }

  return <em>ERROR: Invalid channel id in URL: ${id}</em>;
}
