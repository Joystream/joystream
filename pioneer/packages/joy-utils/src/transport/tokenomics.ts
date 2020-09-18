import BaseTransport from './base';
import { ApiPromise } from '@polkadot/api';
import CouncilTransport from './council';
import WorkingGroupsTransport from './workingGroups';
import { APIQueryCache } from './APIQueryCache';
import { Seats } from '@joystream/types/council';
import { Option } from '@polkadot/types';
import { BlockNumber, BalanceOf, Exposure } from '@polkadot/types/interfaces';
import { WorkerId } from '@joystream/types/working-group';
import { RewardRelationshipId, RewardRelationship } from '@joystream/types/recurring-rewards';
import { StakeId, Stake } from '@joystream/types/stake';
import { CuratorId, Curator, LeadId } from '@joystream/types/content-working-group';
import { TokenomicsData } from '@polkadot/joy-utils/src/types/tokenomics';

export default class TokenomicsTransport extends BaseTransport {
  private councilT: CouncilTransport;
  private workingGroupT: WorkingGroupsTransport;

  constructor (api: ApiPromise, cacheApi: APIQueryCache, councilTransport: CouncilTransport, workingGroups: WorkingGroupsTransport) {
    super(api, cacheApi);
    this.councilT = councilTransport;
    this.workingGroupT = workingGroups;
  }

  async getCouncilMembers () {
    let totalCouncilStake = 0;
    const activeCouncil = await this.api.query.council.activeCouncil() as Seats;

    activeCouncil.map((member) => {
      let stakeAmount = 0;

      stakeAmount += member.stake.toNumber();
      member.backers.forEach((backer) => {
        stakeAmount += backer.stake.toNumber();
      });
      totalCouncilStake += stakeAmount;
    });

    return {
      numberOfCouncilMembers: activeCouncil.length,
      totalCouncilStake
    };
  }

  async calculateCouncilRewards (numberOfCouncilMembers: number) {
    let weekInBlocks = 100800; let councilRewardsInOneWeek = 0; let totalCouncilRewardsPerBlock = 0;
    const payoutInterval = Number((await this.api.query.council.payoutInterval() as Option<BlockNumber>).unwrapOr(0));
    const amountPerPayout = (await this.api.query.council.amountPerPayout() as BalanceOf).toNumber();

    totalCouncilRewardsPerBlock = (amountPerPayout && payoutInterval) ? (amountPerPayout * numberOfCouncilMembers) / payoutInterval : 0;
    const { new_term_duration, voting_period, revealing_period, announcing_period } = await this.councilT.electionParameters();
    const termDuration = new_term_duration.toNumber(); const votingPeriod = voting_period.toNumber(); const revealingPeriod = revealing_period.toNumber(); const announcingPeriod = announcing_period.toNumber();

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
  }

  async getCouncilData () {
    const { numberOfCouncilMembers, totalCouncilStake } = await this.getCouncilMembers();
    const totalCouncilRewardsInOneWeek = await this.calculateCouncilRewards(numberOfCouncilMembers);

    return {
      numberOfCouncilMembers,
      totalCouncilRewardsInOneWeek,
      totalCouncilStake
    };
  }

  async getStorageProviders () {
    const stakeIds: StakeId[] = []; const rewardIds: RewardRelationshipId[] = []; let leadStakeId = null as (StakeId | null); let leadRewardId = null as (RewardRelationshipId | null); let numberOfStorageProviders = 0; let leadNumber = 0;
    const allWorkers = await this.workingGroupT.allWorkers('Storage');
    const currentLeadId = (await this.api.query.storageWorkingGroup.currentLead() as Option<WorkerId>).unwrapOr(null)?.toNumber();

    allWorkers.forEach(([workerId, worker]) => {
      const stakeId = worker.role_stake_profile.isSome ? worker.role_stake_profile.unwrap().stake_id : null;
      const rewardId = worker.reward_relationship.unwrapOr(null);

      if (currentLeadId !== undefined && currentLeadId === workerId.toNumber()) {
        leadStakeId = stakeId;
        leadRewardId = rewardId;
        leadNumber += 1;
      } else {
        numberOfStorageProviders += 1;

        if (stakeId) {
          stakeIds.push(stakeId);
        }

        if (rewardId) {
          rewardIds.push(rewardId);
        }
      }
    });

    return {
      numberOfStorageProviders,
      stakeIds,
      rewardIds,
      leadNumber,
      leadRewardId,
      leadStakeId
    };
  }

  async calcuateStorageProvider (stakeIds: StakeId[], leadStakeId: StakeId | null, rewardIds: RewardRelationshipId[], leadRewardId: RewardRelationshipId | null) {
    let totalStorageProviderStake = 0; let leadStake = 0; let storageProviderRewardsPerBlock = 0; let storageLeadRewardsPerBlock = 0;

    (await this.api.query.stake.stakes.multi(stakeIds) as Stake[]).forEach((stake) => {
      totalStorageProviderStake += stake.value.toNumber();
    });
    (await this.api.query.recurringRewards.rewardRelationships.multi(rewardIds) as RewardRelationship[]).map((rewardRelationship) => {
      const amount = rewardRelationship.amount_per_payout.toNumber();
      const payoutInterval = rewardRelationship.payout_interval.isSome ? rewardRelationship.payout_interval.unwrap().toNumber() : null;

      if (amount && payoutInterval) {
        storageProviderRewardsPerBlock += amount / payoutInterval;
      }
    });

    if (leadStakeId !== null) {
      leadStake += (await this.api.query.stake.stakes(leadStakeId) as Stake).value.toNumber();
    }

    if (leadRewardId !== null) {
      const leadRewardData = (await this.api.query.recurringRewards.rewardRelationships(leadRewardId) as RewardRelationship);
      const leadAmount = leadRewardData.amount_per_payout.toNumber();
      const leadRewardInterval = leadRewardData.payout_interval.isSome ? leadRewardData.payout_interval.unwrap().toNumber() : null;

      if (leadAmount && leadRewardInterval) {
        storageLeadRewardsPerBlock += leadAmount / leadRewardInterval;
      }
    }

    return {
      totalStorageProviderStake,
      leadStake,
      storageProviderRewardsPerWeek: storageProviderRewardsPerBlock * 100800,
      storageProviderLeadRewardsPerWeek: storageLeadRewardsPerBlock * 100800
    };
  }

  async getStorageProviderData () {
    const { numberOfStorageProviders, leadNumber, stakeIds, rewardIds, leadRewardId, leadStakeId } = await this.getStorageProviders();
    const { totalStorageProviderStake, leadStake, storageProviderRewardsPerWeek, storageProviderLeadRewardsPerWeek } = await this.calcuateStorageProvider(stakeIds, leadStakeId, rewardIds, leadRewardId);

    return {
      numberOfStorageProviders,
      storageProviderLeadNumber: leadNumber,
      totalStorageProviderStake,
      totalStorageProviderLeadStake: leadStake,
      storageProviderRewardsPerWeek,
      storageProviderLeadRewardsPerWeek
    };
  }

  async getContentCurators () {
    const stakeIds: StakeId[] = []; const rewardIds: RewardRelationshipId[] = []; let numberOfContentCurators = 0; let leadNumber = 0;
    const contentCurators = await this.entriesByIds<CuratorId, Curator>(this.api.query.contentWorkingGroup.curatorById);
    const currentLeadId = (await this.api.query.contentWorkingGroup.currentLeadId() as Option<LeadId>).unwrapOr(null)?.toNumber();

    contentCurators.forEach(([curatorId, curator]) => {
      const stakeId = curator.role_stake_profile.isSome ? curator.role_stake_profile.unwrap().stake_id : null;
      const rewardId = curator.reward_relationship.unwrapOr(null);

      if (currentLeadId !== undefined && currentLeadId === curatorId.toNumber()) {
        leadNumber += 1;
      } else {
        numberOfContentCurators += 1;

        if (stakeId) {
          stakeIds.push(stakeId);
        }

        if (rewardId) {
          rewardIds.push(rewardId);
        }
      }
    });

    return {
      stakeIds,
      rewardIds,
      numberOfContentCurators,
      contentCuratorLeadNumber: leadNumber
    };
  }

  async calculateContentCurator (stakeIds: StakeId[], rewardIds: RewardRelationshipId[]) {
    let totalContentCuratorStake = 0; let contentCuratorRewardsPerBlock = 0;

    (await this.api.query.stake.stakes.multi(stakeIds) as Stake[]).forEach((stake) => {
      totalContentCuratorStake += stake.value.toNumber();
    });
    (await this.api.query.recurringRewards.rewardRelationships.multi(rewardIds) as RewardRelationship[]).map((rewardRelationship) => {
      const amount = rewardRelationship.amount_per_payout.toNumber();
      const payoutInterval = rewardRelationship.payout_interval.isSome ? rewardRelationship.payout_interval.unwrap().toNumber() : null;

      if (amount && payoutInterval) {
        contentCuratorRewardsPerBlock += amount / payoutInterval;
      }
    });

    return {
      totalContentCuratorStake,
      contentCuratorRewardsPerBlock
    };
  }

  async getContentCuratorData () {
    const { stakeIds, rewardIds, numberOfContentCurators, contentCuratorLeadNumber } = await this.getContentCurators();
    const { totalContentCuratorStake, contentCuratorRewardsPerBlock } = await this.calculateContentCurator(stakeIds, rewardIds);

    return {
      numberOfContentCurators,
      contentCuratorLeadNumber,
      totalContentCuratorStake,
      contentCuratorRewardsPerWeek: contentCuratorRewardsPerBlock * 100800
    };
  }

  async getValidators () {
    const validatorIds = await this.api.query.session.validators();
    const currentEra = (await this.api.query.staking.currentEra()).unwrapOr(null);
    let totalValidatorStake = 0; let numberOfNominators = 0;

    if (currentEra !== null) {
      const validatorStakeData = await this.api.query.staking.erasStakers.multi(validatorIds.map((validatorId) => [currentEra, validatorId])) as Exposure[];

      validatorStakeData.forEach((data) => {
        if (!data.total.isEmpty) {
          totalValidatorStake += data.total.toNumber();
        }

        if (!data.others.isEmpty) {
          numberOfNominators += data.others.length;
        }
      });
    }

    return {
      numberOfValidators: validatorIds.length,
      numberOfNominators,
      totalValidatorStake
    };
  }

  calculateValidators (totalValidatorStake: number, totalIssuance: number) {
    let validatorRewards = 0;
    const [idealStakingRate, minimumInflation, maximumInflation, fallOff, eraLength, year] = [0.25, 0.05, 0.75, 0.05, 3600, (365.2425 * 24 * 60 * 60)];
    const stakingRate = totalValidatorStake / totalIssuance;

    if (stakingRate > idealStakingRate) {
      validatorRewards = totalIssuance * (minimumInflation + (maximumInflation - minimumInflation) * 2 ** ((idealStakingRate - stakingRate) / fallOff)) * eraLength / year;
    } else if (stakingRate === idealStakingRate) {
      validatorRewards = (totalIssuance * maximumInflation * eraLength) / year;
    } else {
      validatorRewards = (totalIssuance * minimumInflation + totalIssuance * (maximumInflation - minimumInflation) * (stakingRate / idealStakingRate)) * eraLength / year;
    }

    return validatorRewards;
  }

  async getValidatorData (totalIssuance: number) {
    const { numberOfValidators, numberOfNominators, totalValidatorStake } = await this.getValidators();
    const validatorRewardsPerEra = this.calculateValidators(totalValidatorStake, totalIssuance);

    return {
      numberOfValidators,
      numberOfNominators,
      totalValidatorStake,
      validatorRewardsPerWeek: validatorRewardsPerEra * 168
    };
  }

  async getTokenomicsData (): Promise<TokenomicsData> {
    const totalIssuance = (await this.api.query.balances.totalIssuance()).toNumber();
    const { numberOfCouncilMembers, totalCouncilRewardsInOneWeek, totalCouncilStake } = await this.getCouncilData();
    const { numberOfStorageProviders, storageProviderLeadNumber, totalStorageProviderStake, totalStorageProviderLeadStake, storageProviderLeadRewardsPerWeek, storageProviderRewardsPerWeek } = await this.getStorageProviderData();
    const { numberOfContentCurators, contentCuratorLeadNumber, totalContentCuratorStake, contentCuratorRewardsPerWeek } = await this.getContentCuratorData();
    const { numberOfValidators, numberOfNominators, totalValidatorStake, validatorRewardsPerWeek } = await this.getValidatorData(totalIssuance);
    const currentlyStakedTokens = totalCouncilStake + totalStorageProviderStake + totalStorageProviderLeadStake + totalContentCuratorStake + totalValidatorStake;
    const totalWeeklySpending = totalCouncilRewardsInOneWeek + storageProviderRewardsPerWeek + storageProviderLeadRewardsPerWeek + contentCuratorRewardsPerWeek + validatorRewardsPerWeek;
    const totalNumberOfActors = numberOfCouncilMembers + numberOfStorageProviders + storageProviderLeadNumber + numberOfContentCurators + contentCuratorLeadNumber + numberOfValidators;

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
        totalStake: totalStorageProviderStake,
        stakeShare: totalStorageProviderStake / currentlyStakedTokens,
        rewardsPerWeek: storageProviderRewardsPerWeek,
        rewardsShare: storageProviderRewardsPerWeek / totalWeeklySpending,
        lead: {
          number: storageProviderLeadNumber,
          totalStake: totalStorageProviderLeadStake,
          stakeShare: totalStorageProviderLeadStake / currentlyStakedTokens,
          rewardsPerWeek: storageProviderLeadRewardsPerWeek,
          rewardsShare: storageProviderLeadRewardsPerWeek / totalWeeklySpending
        }
      },
      contentCurators: {
        number: numberOfContentCurators,
        contentCuratorLead: contentCuratorLeadNumber,
        rewardsPerWeek: contentCuratorRewardsPerWeek,
        rewardsShare: contentCuratorRewardsPerWeek / totalWeeklySpending,
        totalStake: totalContentCuratorStake,
        stakeShare: totalContentCuratorStake / currentlyStakedTokens
      }
    };
  }
}
