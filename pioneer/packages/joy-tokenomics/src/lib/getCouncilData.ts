import { Vec, Option } from '@polkadot/types';
import { ApiPromise } from '@polkadot/api';
import { BlockNumber, BalanceOf } from '@polkadot/types/interfaces';
import { Seats, Backer } from '@joystream/types/src/council';

const getCouncilMembers = async (api: ApiPromise) => {
  let totalStake = 0;
  const activeCouncil = await api.query.council.activeCouncil() as Seats;
  const payoutInterval = Number((await api.query.council.payoutInterval() as Option<BlockNumber>).unwrapOr(0));
  const amountPerPayout = (await api.query.council.amountPerPayout() as BalanceOf).toNumber();
  activeCouncil.map((member) => {
    let stakeAmount = 0;
    stakeAmount += Number(member.get('stake'));
    const backers = member.get('backers') as Vec<Backer>;
    if (!backers?.isEmpty) {
      backers.forEach((backer) => {
        stakeAmount += Number(backer.get('stake'));
      });
    }
    totalStake += stakeAmount;
  });
  return {
    numberOfCouncilMembers: activeCouncil.length,
    totalCouncilRewardsPerBlock: (amountPerPayout && payoutInterval) ? (amountPerPayout * activeCouncil.length) / payoutInterval : 0,
    totalCouncilStake: totalStake
  };
};

const calculateCouncilRewards = async (api: ApiPromise, totalCouncilRewardsPerBlock: number): Promise<number> => {
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
  return councilRewardsInOneWeek;
};

export default async (api: ApiPromise) => {
  const { numberOfCouncilMembers, totalCouncilRewardsPerBlock, totalCouncilStake } = await getCouncilMembers(api);
  const totalCouncilRewardsInOneWeek = await calculateCouncilRewards(api, totalCouncilRewardsPerBlock);
  return {
    numberOfCouncilMembers,
    totalCouncilRewardsInOneWeek,
    totalCouncilStake
  };
};
