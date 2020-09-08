import { ApiPromise } from '@polkadot/api';
import { Reward } from './getTokenomicsData';
import { LeadId } from '@joystream/types/content-working-group';
import { Option } from '@polkadot/types';

type ContentCurator = {
  reward_relationship: number;
  role_stake_profile: {
    stake_id: number;
  };
}

const getCurators = async (api: ApiPromise): Promise<Array<ContentCurator>> => {
  const curators: Array<ContentCurator> = [];
  const [workerIds, curatorData] = ((await api.query.contentWorkingGroup.curatorById()).toJSON() as [Array<number>, Array<object>]);
  curatorData.map((data: any, index: number) => {
    if (Object.keys(data.stage)[0] === 'Active') {
      curators.push({ ...data, workerId: workerIds[index] });
    }
  });
  return curators;
};

const calculateRewards = (curators: Array<ContentCurator>, recurringRewards: Array<Reward>): number => {
  let rewardsPerBlock = 0;
  curators.forEach((curator) => {
    const reward: Reward = recurringRewards.filter((reward: Reward) => reward.recipient === curator.reward_relationship)[0];
    if (reward && reward.amount_per_payout && reward.payout_interval) {
      rewardsPerBlock += reward.amount_per_payout / reward.payout_interval;
    }
  });
  return rewardsPerBlock;
};

const calculateStake = async (api: ApiPromise, curators: Array<ContentCurator>): Promise<number> => {
  const stakeIds: Array<number> = []; let totalContentCuratorStake = 0;
  curators.forEach((curator) => {
    if (curator.role_stake_profile) {
      stakeIds.push(curator.role_stake_profile.stake_id);
    }
  });
  const curatorStakeData = await api.query.stake.stakes.multi(stakeIds);
  curatorStakeData.map((stakeData: any) => {
    totalContentCuratorStake += stakeData.toJSON()[0].staking_status.Staked.staked_amount;
  });
  return totalContentCuratorStake;
};

export default async (api: ApiPromise, recurringRewards: Array<Reward>) => {
  const optLeadId = (await api.query.contentWorkingGroup.currentLeadId()) as Option<LeadId>;
  const currentLead = optLeadId.unwrapOr(null);
  const curators = await getCurators(api);
  const rewardsPerBlock = calculateRewards(curators, recurringRewards);
  const totalContentCuratorStake = await calculateStake(api, curators);
  return {
    numberOfCurators: curators.length,
    contentCuratorLead: currentLead ? 1 : 0,
    curatorRewardsPerWeeek: rewardsPerBlock * 100800,
    totalContentCuratorStake
  };
};
