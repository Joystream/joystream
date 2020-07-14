import BN from 'bn.js';
import { ChannelType } from '../schemas/channel/Channel';

// TODO rename to EnrichedChannelType
export type ChannelEntity = ChannelType & {

  // Stats:
  rewardEarned: BN;
  contentItemsCount: number;
};
