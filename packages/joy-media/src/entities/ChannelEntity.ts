import BN from 'bn.js';
import { ChannelType } from '../schemas/channel/Channel';

// TODO rename to EnrichedChannelType
export type ChannelEntity = ChannelType & {

  // TODO Reconsider this field. It's not present in Runtime.
  visibility: 'Public' | 'Unlisted',

  blocked: boolean,
  revenueAccountId: string,

  // Stats:
  rewardEarned: BN,
  contentItemsCount: number,
};