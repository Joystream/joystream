import BN from 'bn.js';

export type ChannelEntity = {
  id: number,

  content: 'video' | 'music',
  
  handle: string,
  title: string,
  description: string,
  avatar: string,
  banner: string,
  
  revenueAccountId: string,
  visibility: 'Public' | 'Unlisted',
  blocked: boolean,

  // Stats:
  rewardEarned: BN,
  contentItemsCount: number,
};