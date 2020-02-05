import BN from 'bn.js';
import { ChannelType } from '../schemas/channel/Channel';

// TODO rename to EnrichedChannelType
export type ChannelEntity = ChannelType & {

  revenueAccountId: string,
  visibility: 'Public' | 'Unlisted',
  blocked: boolean,

  // Stats:
  rewardEarned: BN,
  contentItemsCount: number,
};