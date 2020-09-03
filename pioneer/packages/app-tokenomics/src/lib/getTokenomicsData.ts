import { ApiPromise } from '@polkadot/api';

import getStorageProviderData from './getStorageProviderData';
import getCouncilData from './getCouncilData';
import getValidatorData from './getValidatorData';
import getContentCuratorData from './getContentCuratorData';

export type TokenomicsData = {
  totalIssuance: number;
  currentlyStakedTokens: number;
  totalWeeklySpending: number;
  totalNumberOfActors: number;
  validators: {
    number: number;
    nominators: {
      number: number;
    };
    rewardsPerWeek: number;
    rewardsShare: number;
    totalStake: number;
    stakeShare: number;
  };
  council: {
    number: number;
    rewardsPerWeek: number;
    rewardsShare: number;
    totalStake: number;
    stakeShare: number;
  };
  storageProviders: {
    number: number;
    totalStake: number;
    stakeShare: number;
    rewardsPerWeek: number;
    rewardsShare: number;
    lead: {
      number: number;
      totalStake: number;
      stakeShare: number;
      rewardsPerWeek: number;
      rewardsShare: number;
    };
  };
  contentCurators: {
    number: number;
    contentCuratorLead: number;
    rewardsPerWeek: number;
    rewardsShare: number;
    totalStake: number;
    stakeShare: number;
  };
}

export type Reward = {
  recipient: number;
  amount_per_payout: number;
  payout_interval: number;
}

export default async (api: ApiPromise): Promise<TokenomicsData> => {
  const totalIssuance = (await api.query.balances.totalIssuance()).toJSON() as number;
  const [, recurringRewards] = (await api.query.recurringRewards.rewardRelationships()).toJSON() as [Array<number>, Array<Reward>];
  const { numberOfValidators, numberOfNominators, validatorRewardsPerWeek, totalValidatorStake } = await getValidatorData(api, totalIssuance);
  const { numberOfCouncilMembers, totalCouncilRewardsInOneWeek, totalCouncilStake } = await getCouncilData(api);
  const { numberOfStorageProviders, totalProviderStake, leadStake, providerRewardsPerWeek, leadRewardsPerWeek, storageProviderLead } = await getStorageProviderData(api, recurringRewards);
  const { numberOfCurators, contentCuratorLead, curatorRewardsPerWeeek, totalContentCuratorStake } = await getContentCuratorData(api, recurringRewards);
  const currentlyStakedTokens = totalValidatorStake + totalCouncilStake + totalProviderStake + leadStake + totalContentCuratorStake;
  const totalWeeklySpending = validatorRewardsPerWeek + totalCouncilRewardsInOneWeek + providerRewardsPerWeek + leadRewardsPerWeek + curatorRewardsPerWeeek;
  const totalNumberOfActors = numberOfValidators + numberOfCouncilMembers + numberOfStorageProviders + storageProviderLead + numberOfCurators + contentCuratorLead;

  return {
    totalIssuance,
    currentlyStakedTokens,
    totalWeeklySpending,
    totalNumberOfActors,
    validators: {
      number: numberOfValidators,
      nominators: {
        number: numberOfNominators
      },
      rewardsPerWeek: validatorRewardsPerWeek,
      rewardsShare: validatorRewardsPerWeek / totalWeeklySpending,
      totalStake: totalValidatorStake,
      stakeShare: totalValidatorStake / currentlyStakedTokens
    },
    council: {
      number: numberOfCouncilMembers,
      rewardsPerWeek: totalCouncilRewardsInOneWeek,
      rewardsShare: totalCouncilRewardsInOneWeek / totalWeeklySpending,
      totalStake: totalCouncilStake,
      stakeShare: totalCouncilStake / currentlyStakedTokens
    },
    storageProviders: {
      number: numberOfStorageProviders,
      totalStake: totalProviderStake,
      stakeShare: totalProviderStake / currentlyStakedTokens,
      rewardsPerWeek: providerRewardsPerWeek,
      rewardsShare: providerRewardsPerWeek / totalWeeklySpending,
      lead: {
        number: storageProviderLead,
        totalStake: leadStake,
        stakeShare: leadStake / currentlyStakedTokens,
        rewardsPerWeek: leadRewardsPerWeek,
        rewardsShare: leadRewardsPerWeek / totalWeeklySpending
      }
    },
    contentCurators: {
      number: numberOfCurators,
      contentCuratorLead,
      rewardsPerWeek: curatorRewardsPerWeeek,
      rewardsShare: curatorRewardsPerWeeek / totalWeeklySpending,
      totalStake: totalContentCuratorStake,
      stakeShare: totalContentCuratorStake / currentlyStakedTokens
    }
  };
};
