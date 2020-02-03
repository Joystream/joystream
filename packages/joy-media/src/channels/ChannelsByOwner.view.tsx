import React from 'react';
import { RouteComponentProps } from 'react-router';
import { MediaView } from '../MediaView';
import { ChannelsByOwnerProps, ChannelsByOwner } from './ChannelsByOwner';
import { MemberId } from '@joystream/types/members';

type Props = ChannelsByOwnerProps;

export const ChannelsByOwnerView = MediaView<Props>({
  component: ChannelsByOwner,
  resolveProps: async (props) => {
    const { transport, memberId } = props;
    const channels = await transport.channelsByOwner(memberId);
    return { channels };
  }
});

export const ChannelsByOwnerWithRouter = (props: Props & RouteComponentProps<any>) => {
  const { match: { params: { id }}} = props;

  if (id) {
    try {
      return <ChannelsByOwnerView {...props} memberId={new MemberId(id)} />;
    } catch (err) {
      console.log('ChannelsByOwnerWithRouter failed:', err);
    }
  }

  return <em>ERROR: Invalid member id in URL: ${id}</em>;
}