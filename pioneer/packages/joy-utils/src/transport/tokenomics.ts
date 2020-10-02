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
import { TokenomicsData } from '@polkadot/joy-utils/src/types/tokenomics';
import { calculateValidatorsRewardsPerEra } from '../functions/staking';
import { WorkingGroupKey } from '@joystream/types/common';

export default class TokenomicsTransport extends BaseTransport {
  private councilT: CouncilTransport;
  private workingGroupT: WorkingGroupsTransport;

  constructor (api: ApiPromise, cacheApi: APIQueryCache, councilTransport: CouncilTransport, workingGroups: WorkingGroupsTransport) {
    super(api, cacheApi);
    this.councilT = councilTransport;
    this.workingGroupT = workingGroups;
  }

  async councilSizeAndStake () {
    let totalCouncilStake = 0;
    const activeCouncil = await this.council.activeCouncil() as Seats;

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

  private async councilRewardsPerWeek (numberOfCouncilMembers: number) {
    const payoutInterval = Number((await this.api.query.council.payoutInterval() as Option<BlockNumber>).unwrapOr(0));
    const amountPerPayout = (await this.api.query.council.amountPerPayout() as BalanceOf).toNumber();
    const totalCouncilRewardsPerBlock = (amountPerPayout && payoutInterval)
      ? (amountPerPayout * numberOfCouncilMembers) / payoutInterval
      : 0;

    const { new_term_duration, voting_period, revealing_period, announcing_period } = await this.councilT.electionParameters();
    const termDuration = new_term_duration.toNumber();
    const votingPeriod = voting_period.toNumber();
    const revealingPeriod = revealing_period.toNumber();
    const announcingPeriod = announcing_period.toNumber();
    const weekInBlocks = 100800;

    const councilTermDurationRatio = termDuration / (termDuration + votingPeriod + revealingPeriod + announcingPeriod);
    const avgCouncilRewardPerBlock = councilTermDurationRatio * totalCouncilRewardsPerBlock;
    const avgCouncilRewardPerWeek = avgCouncilRewardPerBlock * weekInBlocks;

    return avgCouncilRewardPerWeek;
  }

  async getCouncilData () {
    const { numberOfCouncilMembers, totalCouncilStake } = await this.councilSizeAndStake();
    const totalCouncilRewardsInOneWeek = await this.councilRewardsPerWeek(numberOfCouncilMembers);

    return {
      numberOfCouncilMembers,
      totalCouncilRewardsInOneWeek,
      totalCouncilStake
    };
  }

  private async workingGroupSizeAndIds (group: WorkingGroupKey) {
    const workerStakeIds: StakeId[] = [];
    const workerRewardIds: RewardRelationshipId[] = [];
    let leadStakeId: StakeId | null = null;
    let leadRewardId: RewardRelationshipId | null = null;
    let numberOfWorkers = 0;
    let leadNumber = 0;
    const allWorkers = await this.workingGroupT.allWorkers(group);
    const currentLeadId = (await this.workingGroupT.queryByGroup(group).currentLead() as Option<WorkerId>)
      .unwrapOr(undefined)?.toNumber();

    allWorkers.forEach(([workerId, worker]) => {
      const stakeId = worker.role_stake_profile.isSome ? worker.role_stake_profile.unwrap().stake_id : null;
      const rewardId = worker.reward_relationship.unwrapOr(null);

      if (currentLeadId !== undefined && currentLeadId === workerId.toNumber()) {
        leadStakeId = stakeId;
        leadRewardId = rewardId;
        leadNumber += 1;
      } else {
        numberOfWorkers += 1;

        if (stakeId) {
          workerStakeIds.push(stakeId);
        }

        if (rewardId) {
          workerRewardIds.push(rewardId);
        }
      }
    });

    return {
      numberOfWorkers,
      workerStakeIds,
      workerRewardIds,
      leadNumber,
      leadRewardId,
      leadStakeId
    };
  }

  private async resolveGroupStakeAndRewards (
    workerStakeIds: StakeId[],
    leadStakeId: StakeId | null,
    workerRewardIds: RewardRelationshipId[],
    leadRewardId: RewardRelationshipId | null
  ) {
    let workersStake = 0;
    let leadStake = 0;
    let workersRewardsPerBlock = 0;
    let leadRewardsPerBlock = 0;

    (await this.api.query.stake.stakes.multi<Stake>(workerStakeIds)).forEach((stake) => {
      workersStake += stake.value.toNumber();
    });
    (await this.api.query.recurringRewards.rewardRelationships.multi<RewardRelationship>(workerRewardIds)).map((rewardRelationship) => {
      const amount = rewardRelationship.amount_per_payout.toNumber();
      const payoutInterval = rewardRelationship.payout_interval.isSome
        ? rewardRelationship.payout_interval.unwrap().toNumber()
        : null;

      if (amount && payoutInterval) {
        workersRewardsPerBlock += amount / payoutInterval;
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
        leadRewardsPerBlock += leadAmount / leadRewardInterval;
      }
    }

    return {
      workersStake,
      leadStake,
      workersRewardsPerWeek: workersRewardsPerBlock * 100800,
      leadRewardsPerWeek: leadRewardsPerBlock * 100800
    };
  }

  async getWorkingGroupData (group: WorkingGroupKey) {
    const { numberOfWorkers, leadNumber, workerStakeIds, workerRewardIds, leadRewardId, leadStakeId } =
      await this.workingGroupSizeAndIds(group);
    const { workersStake, leadStake, workersRewardsPerWeek, leadRewardsPerWeek } =
      await this.resolveGroupStakeAndRewards(workerStakeIds, leadStakeId, workerRewardIds, leadRewardId);

    return {
      numberOfWorkers,
      leadNumber,
      workersStake,
      leadStake,
      workersRewardsPerWeek,
      leadRewardsPerWeek
    };
  }

  async validatorSizeAndStake () {
    const validatorIds = await this.api.query.session.validators();
    const currentEra = (await this.api.query.staking.currentEra()).unwrapOr(null);
    let totalValidatorStake = 0; let numberOfNominators = 0;

    if (currentEra !== null) {
      const validatorStakeData = await this.api.query.staking.erasStakers.multi<Exposure>(
        validatorIds.map((validatorId) => [currentEra, validatorId])
      );

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

  async getValidatorData () {
    const totalIssuance = (await this.api.query.balances.totalIssuance()).toNumber();
    const { numberOfValidators, numberOfNominators, totalValidatorStake } = await this.validatorSizeAndStake();
    const validatorRewardsPerEra = calculateValidatorsRewardsPerEra(totalValidatorStake, totalIssuance);

    return {
      totalIssuance,
      numberOfValidators,
      numberOfNominators,
      totalValidatorStake,
      validatorRewardsPerWeek: validatorRewardsPerEra * 168 // Assuming 1 era = 1h
    };
  }

  async getTokenomicsData (): Promise<TokenomicsData> {
    const { numberOfCouncilMembers, totalCouncilRewardsInOneWeek, totalCouncilStake } =
      await this.getCouncilData();
    const workingGroupsData = {
      storageProviders: await this.getWorkingGroupData('Storage'),
      curators: await this.getWorkingGroupData('Content')
    };
    const { numberOfValidators, numberOfNominators, totalValidatorStake, validatorRewardsPerWeek, totalIssuance } =
      await this.getValidatorData();

    const currentlyStakedTokens =
      totalCouncilStake +
      Object.values(workingGroupsData).reduce(
        (sum, { workersStake, leadStake }) => sum + workersStake + leadStake,
        0) +
      totalValidatorStake;

    const totalWeeklySpending =
      totalCouncilRewardsInOneWeek +
      Object.values(workingGroupsData).reduce(
        (sum, { workersRewardsPerWeek, leadRewardsPerWeek }) => sum + workersRewardsPerWeek + leadRewardsPerWeek,
        0) +
      validatorRewardsPerWeek;

    const totalNumberOfActors =
      numberOfCouncilMembers +
      Object.values(workingGroupsData).reduce(
        (sum, { numberOfWorkers, leadNumber }) => sum + numberOfWorkers + leadNumber,
        0) +
      numberOfValidators;

    const resolveGroupData = (data: typeof workingGroupsData[keyof typeof workingGroupsData]) => ({
      number: data.numberOfWorkers,
      totalStake: data.workersStake,
      stakeShare: data.workersStake / currentlyStakedTokens,
      rewardsPerWeek: data.workersRewardsPerWeek,
      rewardsShare: data.workersRewardsPerWeek / totalWeeklySpending,
      lead: {
        number: data.leadNumber,
        totalStake: data.leadStake,
        stakeShare: data.leadStake / currentlyStakedTokens,
        rewardsPerWeek: data.leadRewardsPerWeek,
        rewardsShare: data.leadRewardsPerWeek / totalWeeklySpending
      }
    });

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
      storageProviders: resolveGroupData(workingGroupsData.storageProviders),
      contentCurators: resolveGroupData(workingGroupsData.curators)
    };
  }

  async networkStatistics () {
    const blockHeight = (await this.api.derive.chain.bestNumber()).toNumber();
    const numberOfMembers = (await this.api.query.members.nextMemberId() as MemberId).toNumber();
    const content = (await this.api.query.versionedStore.classById(7) as Class).properties;
    const numberOfChannels = (await this.api.query.contentWorkingGroup.nextChannelId() as ChannelId).toNumber();
    const proposalCount = Number(await this.api.query.proposalsEngine.proposalCount());
    const numberOfForumCategories = (await this.api.query.forum.nextCategoryId() as CategoryId).toNumber();
    const numberOfForumPosts = (await this.api.query.forum.nextPostId() as PostId).toNumber();
    const [councilMintId, contentCuratorMintId, storageMintId] = await Promise.all([await this.api.query.council.councilMint() as MintId, await this.api.query.contentWorkingGroup.mint() as MintId, await this.api.query.storageWorkingGroup.mint() as MintId]);
    const [councilMint, contentMint, storageMint] = (await this.api.query.minting.mints.multi<Mint>([councilMintId, contentCuratorMintId, storageMintId]));

    return {
      blockHeight,
      numberOfMembers,
      content: content.length,
      numberOfChannels,
      proposalCount,
      historicalProposals: HISTORICAL_PROPOSALS.length,
      numberOfForumCategories,
      numberOfForumPosts,
      councilMintCapacity: councilMint.capacity.toNumber(),
      councilMintSpent: councilMint.total_minted.toNumber(),
      contentCuratorMintCapacity: contentMint.capacity.toNumber(),
      contentCuratorMintSpent: contentMint.total_minted.toNumber(),
      storageProviderMintCapacity: storageMint.capacity.toNumber(),
      storageProviderMintSpent: storageMint.total_minted.toNumber()
    };
  }

  private textProposalData (proposals:[ProposalId, ProposalDetails][], proposalData: Proposal[]) {
    const textProposals = { all: 0, Active: 0, Approved: 0, Rejected: 0, Expired: 0, Slashed: 0, Canceled: 0, Vetoed: 0, tokensBurned: 0 };

    proposalData.forEach((proposal, index) => {
      const proposalDetails = proposals[index][1];

      if (proposalDetails.isOfType('Text')) {
        textProposals.all++;

        if (proposal.status.isOfType('Active')) {
          textProposals.Active++;
        } else if (proposal.status.isOfType('Finalized')) {
          const proposalStatusIfFinalized = proposal.status.asType('Finalized').proposalStatus;

          textProposals[proposalStatusIfFinalized.type]++;

          if (proposalStatusIfFinalized.isOfType('Slashed')) {
            textProposals.tokensBurned += proposal.parameters.requiredStake.unwrap().toNumber();
          } else if (proposalStatusIfFinalized.isOfType('Canceled')) {
            textProposals.tokensBurned += 10000;
          } else {
            textProposals.tokensBurned += 5000;
          }
        }
      }
    });

    return textProposals;
  }

  private spendingProposalData (proposals:[ProposalId, ProposalDetails][], proposalData: Proposal[]) {
    const spendingProposals = { all: 0, Active: 0, Approved: 0, Rejected: 0, Expired: 0, Slashed: 0, Canceled: 0, Vetoed: 0, tokensBurned: 0 };

    proposalData.forEach((proposal, index) => {
      const proposalDetails = proposals[index][1];

      if (proposalDetails.isOfType('Spending')) {
        spendingProposals.all++;

        if (proposal.status.isOfType('Active')) {
          spendingProposals.Active++;
        } else if (proposal.status.isOfType('Finalized')) {
          const proposalStatusIfFinalized = proposal.status.asType('Finalized').proposalStatus;

          spendingProposals[proposalStatusIfFinalized.type]++;

          if (proposalStatusIfFinalized.isOfType('Approved') && proposalStatusIfFinalized.asType('Approved').isOfType('Executed')) {
            spendingProposals.tokensBurned += Number(proposalDetails.asType('Spending')[0]);
          } else if (proposalStatusIfFinalized.isOfType('Approved') && !proposalStatusIfFinalized.asType('Approved').isOfType('Executed')) {
            spendingProposals.tokensBurned += 0;
          } else if (proposalStatusIfFinalized.isOfType('Slashed')) {
            spendingProposals.tokensBurned += proposal.parameters.requiredStake.unwrap().toNumber();
          } else if (proposalStatusIfFinalized.isOfType('Canceled')) {
            spendingProposals.tokensBurned += 10000;
          } else {
            spendingProposals.tokensBurned += 5000;
          }
        }
      }
    });

    return spendingProposals;
  }

  private workingGroupsProposalData (proposals:[ProposalId, ProposalDetails][], proposalData: Proposal[]) {
    const workingGroupsProposals = { all: 0, Active: 0, Approved: 0, Rejected: 0, Expired: 0, Slashed: 0, Canceled: 0, Vetoed: 0, tokensBurned: 0 };

    proposalData.forEach((proposal, index) => {
      const proposalDetails = proposals[index][1];

      if (!proposalDetails.isOfType('Text') &&
        !proposalDetails.isOfType('Spending') &&
        !proposalDetails.isOfType('RuntimeUpgrade') &&
        !proposalDetails.isOfType('SetElectionParameters') &&
        !proposalDetails.isOfType('SetValidatorCount')
      ) {
        workingGroupsProposals.all++;

        if (proposal.status.isOfType('Active')) {
          workingGroupsProposals.Active++;
        } else if (proposal.status.isOfType('Finalized')) {
          const proposalStatusIfFinalized = proposal.status.asType('Finalized').proposalStatus;

          workingGroupsProposals[proposalStatusIfFinalized.type]++;

          if (proposalDetails.isOfType('SlashWorkingGroupLeaderStake') && proposalStatusIfFinalized.isOfType('Approved') && proposalStatusIfFinalized.asType('Approved').isOfType('Executed')) {
            workingGroupsProposals.tokensBurned += Number(proposalDetails.asType('SlashWorkingGroupLeaderStake')[1]);
          } else if (proposalStatusIfFinalized.isOfType('Slashed')) {
            workingGroupsProposals.tokensBurned += proposal.parameters.requiredStake.unwrap().toNumber();
          } else if (proposalStatusIfFinalized.isOfType('Canceled')) {
            workingGroupsProposals.tokensBurned += 10000;
          } else {
            workingGroupsProposals.tokensBurned += 5000;
          }
        }
      }
    });

    return workingGroupsProposals;
  }

  private networkChangesProposalData (proposals:[ProposalId, ProposalDetails][], proposalData: Proposal[]) {
    const networkChangesProposals = { all: 0, Active: 0, Approved: 0, Rejected: 0, Expired: 0, Slashed: 0, Canceled: 0, Vetoed: 0, tokensBurned: 0 };

    proposalData.forEach((proposal, index) => {
      const proposalDetails = proposals[index][1];

      if (proposalDetails.isOfType('RuntimeUpgrade') || proposalDetails.isOfType('SetElectionParameters') || proposalDetails.isOfType('SetValidatorCount')) {
        networkChangesProposals.all++;

        if (proposal.status.isOfType('Active')) {
          networkChangesProposals.Active++;
        } else if (proposal.status.isOfType('Finalized')) {
          const proposalStatusIfFinalized = proposal.status.asType('Finalized').proposalStatus;

          networkChangesProposals[proposalStatusIfFinalized.type]++;

          if (proposalStatusIfFinalized.isOfType('Slashed')) {
            networkChangesProposals.tokensBurned += proposal.parameters.requiredStake.unwrap().toNumber();
          } else if (proposalStatusIfFinalized.isOfType('Canceled')) {
            networkChangesProposals.tokensBurned += 10000;
          } else {
            networkChangesProposals.tokensBurned += 5000;
          }
        }
      }
    });

    return networkChangesProposals;
  }

  async proposalStatistics () {
    const proposals = await this.entriesByIds<ProposalId, ProposalDetails>(this.api.query.proposalsCodex.proposalDetailsByProposalId);
    const proposalData = await this.api.query.proposalsEngine.proposals.multi<Proposal>(proposals.map(([id, _]) => id));
    const textProposals = this.textProposalData(proposals, proposalData);
    const spendingProposals = this.spendingProposalData(proposals, proposalData);
    const workingGroupsProposals = this.workingGroupsProposalData(proposals, proposalData);
    const networkChangesProposals = this.networkChangesProposalData(proposals, proposalData);

    return {
      textProposals,
      spendingProposals,
      workingGroupsProposals,
      networkChangesProposals,
      allProposals: {
        all: textProposals.all + spendingProposals.all + workingGroupsProposals.all + networkChangesProposals.all,
        Active: textProposals.Active + spendingProposals.Active + workingGroupsProposals.Active + networkChangesProposals.Active,
        Approved: textProposals.Approved + spendingProposals.Approved + workingGroupsProposals.Approved + networkChangesProposals.Approved,
        Rejected: textProposals.Rejected + spendingProposals.Rejected + workingGroupsProposals.Rejected + networkChangesProposals.Rejected,
        Expired: textProposals.Expired + spendingProposals.Expired + workingGroupsProposals.Expired + networkChangesProposals.Expired,
        Slashed: textProposals.Slashed + spendingProposals.Slashed + workingGroupsProposals.Slashed + networkChangesProposals.Slashed,
        Canceled: textProposals.Canceled + spendingProposals.Canceled + workingGroupsProposals.Canceled + networkChangesProposals.Canceled,
        Vetoed: textProposals.Vetoed + spendingProposals.Vetoed + workingGroupsProposals.Vetoed + networkChangesProposals.Vetoed,
        tokensBurned: textProposals.tokensBurned + spendingProposals.tokensBurned + workingGroupsProposals.tokensBurned + networkChangesProposals.tokensBurned
      }
    };
  }
}
