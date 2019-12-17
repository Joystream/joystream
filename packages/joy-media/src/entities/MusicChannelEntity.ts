import BN from 'bn.js';

export type ChannelEntity = {
  contentType: 'video' | 'music',
  
  title: string,
  description: string,
  avatarUrl: string,
  coverUrl: string,
  
  revenueAccountId: string,
  visibility: 'Public' | 'Unlisted',
  blocked: boolean,

  // Stats:
  rewardEarned: BN,
  contentItemsCount: number,
};