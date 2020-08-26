import React from 'react';
import { RouteComponentProps } from 'react-router';
import { MediaView } from '../MediaView';
import { ViewChannelProps, ViewChannel } from './ViewChannel';
import { JoyError } from '@polkadot/joy-utils/react/components';
import { useApi } from '@polkadot/react-hooks';

type Props = ViewChannelProps;

export const ViewChannelView = MediaView<Props>({
  component: ViewChannel,
  triggers: ['id'],
  resolveProps: async (props) => {
    const { transport, id } = props;
    const channel = await transport.channelById(id);
    const videos = await transport.videosByChannelId(id);

    return { channel, videos };
  }
});

export const ViewChannelWithRouter = (props: Props & RouteComponentProps<Record<string, string | undefined>>) => {
  const { match: { params: { id } } } = props;
  const { api } = useApi();

  if (id) {
    try {
      return <ViewChannelView {...props} id={api.createType('ChannelId', id)} />;
    } catch (err) {
      console.log('ViewChannelWithRouter failed:', err);
    }
  }

  return <JoyError title={'Invalid channel id in URL'}>{id}</JoyError>;
};
