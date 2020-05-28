import React from 'react';
import { Statistic } from 'semantic-ui-react';

import { ChannelEntity } from '../entities/ChannelEntity';
import { formatNumber } from '@polkadot/util';

type Props = {
  channel: ChannelEntity;
};

export const ChannelPreviewStats = (props: Props) => {
  const { channel } = props;
  const statSize = 'tiny';

  let itemsPublishedLabel = '';
  if (channel.content === 'Video') {
    itemsPublishedLabel = 'Videos';
  } else if (channel.content === 'Music') {
    itemsPublishedLabel = 'Music tracks';
  }

  return (
    <div className='ChannelStats'>
      <div>
        <Statistic size={statSize}>
          <Statistic.Label>Reward earned</Statistic.Label>
          <Statistic.Value>
            {formatNumber(channel.rewardEarned)}
            &nbsp;<span style={{ fontSize: '1.5rem' }}>JOY</span>
          </Statistic.Value>
        </Statistic>
      </div>

      <div style={{ marginTop: '1rem' }}>
        <Statistic size={statSize}>
          <Statistic.Label>{itemsPublishedLabel}</Statistic.Label>
          <Statistic.Value>{formatNumber(channel.contentItemsCount)}</Statistic.Value>
        </Statistic>
      </div>
    </div>
  );
};
