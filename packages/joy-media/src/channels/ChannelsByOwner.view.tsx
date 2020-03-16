import React from 'react';
import { RouteComponentProps } from 'react-router';

import { GenericAccountId } from '@polkadot/types';
import { MediaView } from '../MediaView';
import { ChannelsByOwnerProps, ChannelsByOwner } from './ChannelsByOwner';

type Props = ChannelsByOwnerProps;

export const ChannelsByOwnerView = MediaView<Props>({
  component: ChannelsByOwner,
  resolveProps: async (props) => {
    const { transport, accountId } = props;
    const channels = await transport.channelsByAccount(accountId);
    return { channels };
  }
});

export const ChannelsByOwnerWithRouter = (props: Props & RouteComponentProps<any>) => {
  const { match: { params: { account }}} = props;

  if (account) {
    try {
      return <ChannelsByOwnerView {...props} accountId={new GenericAccountId(account)} />;
    } catch (err) {
      console.log('ChannelsByOwnerWithRouter failed:', err);
    }
  }

  return <em>ERROR: Invalid account id in URL: ${account}</em>;
}