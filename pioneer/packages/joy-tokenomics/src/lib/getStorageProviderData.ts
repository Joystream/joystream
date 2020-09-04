import { ApiPromise } from '@polkadot/api';
import { Reward } from './getTokenomicsData';

type StorageProvider = {
  reward_relationship: number;
  role_stake_profile: {
    stake_id: number;
  };
  workerId: number;
  lead?: boolean;
}

const getStorageProviders = async (api: ApiPromise): Promise<any> => {
  const storageProviders: Array<StorageProvider> = [];
  let [numberOfStorageProviders, leadNumber] = [0, 0];
  const currentLead = (await api.query.storageWorkingGroup.currentLead()).toJSON() as number;
  const [workerIds, storageProviderData] = (await api.query.storageWorkingGroup.workerById()).toJSON() as [Array<number>, Array<object>];
  storageProviderData.map((providerData: any, index: number) => {
    if (workerIds[index] === currentLead) {
      leadNumber += 1;
      storageProviders.push({
        workerId: workerIds[index],
        lead: true,
        ...providerData
      });
    } else {
      numberOfStorageProviders += 1;
      storageProviders.push({
        workerId: workerIds[index],
        ...providerData
      });
    }
  });
  return {
    numberOfStorageProviders,
    leadNumber,
    storageProviders
  };
};

const calculateProviders = async (api: ApiPromise, storageProviders: Array<StorageProvider>, recurringRewards: Array<Reward>): Promise<any> => {
  let totalProviderStake = 0; let providerRewardsPerBlock = 0; let leadRewardsPerBlock = 0; let leadStake = 0;
  const providerStakeIds: Array<number> = [];
  let leadStakeId: number | null = null;
  storageProviders.forEach((provider: StorageProvider) => {
    // CALCULATE REWARDS
    recurringRewards.forEach((reward: Reward) => {
      if (provider.reward_relationship && reward.recipient === provider.reward_relationship) {
        if (!provider.lead) {
          if (reward.amount_per_payout && reward.payout_interval) {
            providerRewardsPerBlock += reward.amount_per_payout / reward.payout_interval;
          }
        } else {
          if (reward.amount_per_payout && reward.payout_interval) {
            leadRewardsPerBlock += reward.amount_per_payout / reward.payout_interval;
          }
        }
      }
    });
    // ADD STAKING DATA FOR PROVIDERS
    if (provider.role_stake_profile && provider.workerId) {
      if (!provider.lead) {
        providerStakeIds.push(provider.role_stake_profile.stake_id);
      } else {
        leadStakeId = provider.role_stake_profile.stake_id;
      }
    }
  });

  // CALCULATE PROVIDER STAKE
  ((await api.query.stake.stakes.multi(providerStakeIds.map((id: number) => id)))).map((data: any) => {
    totalProviderStake += data[0].toJSON().staking_status.Staked.staked_amount;
  });

  // CALCULATE LEAD STAKE
  if (leadStakeId !== null) {
    leadStake += ((await api.query.stake.stakes(leadStakeId)).toJSON() as Array<any>)[0].staking_status.Staked.staked_amount;
  }

  return {
    totalProviderStake,
    leadStake,
    providerRewardsPerBlock,
    leadRewardsPerBlock
  };
};

export default async (api: ApiPromise, recurringRewards: Array<Reward>): Promise<any> => {
  const { numberOfStorageProviders, leadNumber, storageProviders } = await getStorageProviders(api);
  const { totalProviderStake, leadStake, providerRewardsPerBlock, leadRewardsPerBlock } = await calculateProviders(api, storageProviders, recurringRewards);

  console.log(totalProviderStake, leadStake, providerRewardsPerBlock, leadRewardsPerBlock);

  return {
    numberOfStorageProviders,
    totalProviderStake,
    leadStake,
    providerRewardsPerWeek: providerRewardsPerBlock * 100800,
    leadRewardsPerWeek: leadRewardsPerBlock * 100800,
    storageProviderLead: leadNumber
  };
};
