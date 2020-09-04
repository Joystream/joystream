import { Vec, u32 } from '@polkadot/types';
import { ApiPromise } from '@polkadot/api';
import { BlockNumber, BalanceOf } from '@polkadot/types/interfaces';

const getCouncilMembers = async (api: ApiPromise): Promise<any> => {
  let totalStake = 0;
  const activeCouncil = await api.query.council.activeCouncil() as Vec<u32>;
  const payoutInterval = (await api.query.council.payoutInterval()).toJSON() as number;
  const amountPerPayout = (await api.query.council.amountPerPayout() as BalanceOf).toNumber();
  console.log(amountPerPayout, payoutInterval);
  activeCouncil.map((member: any) => {
    let stakeAmount = 0;
    stakeAmount += member.get('stake').toNumber();
    member.get('backers').forEach((backer: any) => {
      stakeAmount += backer.stake.toNumber();
    });
    totalStake += stakeAmount;
  });
  return {
    numberOfCouncilMembers: activeCouncil.length,
    totalCouncilRewardsPerBlock: (amountPerPayout * activeCouncil.length) / payoutInterval,
    totalCouncilStake: totalStake
  };
};

const calculateCouncilRewards = async (api: ApiPromise, totalCouncilRewardsPerBlock: number): Promise<any> => {
  let weekInBlocks = 100800;
  let councilRewardsInOneWeek = 0;
  const termDuration = (await api.query.councilElection.newTermDuration() as BlockNumber).toNumber();
  const votingPeriod = (await api.query.councilElection.votingPeriod() as BlockNumber).toNumber();
  const revealingPeriod = (await api.query.councilElection.revealingPeriod() as BlockNumber).toNumber();
  const announcingPeriod = (await api.query.councilElection.announcingPeriod() as BlockNumber).toNumber();
  while (weekInBlocks > 0) {
    if (weekInBlocks > termDuration) {
      councilRewardsInOneWeek += termDuration * totalCouncilRewardsPerBlock;
      weekInBlocks -= termDuration;
    } else {
      councilRewardsInOneWeek += weekInBlocks * totalCouncilRewardsPerBlock;
      return councilRewardsInOneWeek;
    }
    // -----------------------------
    if (weekInBlocks > revealingPeriod) {
      weekInBlocks -= revealingPeriod;
    } else {
      return councilRewardsInOneWeek;
    }
    // -----------------------------
    if (weekInBlocks > votingPeriod) {
      weekInBlocks -= votingPeriod;
    } else {
      return councilRewardsInOneWeek;
    }
    // -----------------------------
    if (weekInBlocks > announcingPeriod) {
      weekInBlocks -= announcingPeriod;
    } else {
      return councilRewardsInOneWeek;
    }
  }
};

export default async (api: ApiPromise): Promise<any> => {
  const { numberOfCouncilMembers, totalCouncilRewardsPerBlock, totalCouncilStake } = await getCouncilMembers(api);
  const totalCouncilRewardsInOneWeek = await calculateCouncilRewards(api, totalCouncilRewardsPerBlock) as number;
  return {
    numberOfCouncilMembers,
    totalCouncilRewardsInOneWeek,
    totalCouncilStake
  };
};
