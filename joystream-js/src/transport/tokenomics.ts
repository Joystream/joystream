import BaseTransport from './base'
import { ApiPromise } from '@polkadot/api'
import CouncilTransport from './council'
import WorkingGroupsTransport from './workingGroups'
import { APIQueryCache } from './APIQueryCache'
import { Exposure } from '@polkadot/types/interfaces'
import { RewardRelationshipId, RewardRelationship } from '@joystream/types/recurring-rewards'
import { StakeId, Stake } from '@joystream/types/stake'
import { TokenomicsData } from '../types/tokenomics'
import { calculateValidatorsRewardsPerEra } from '../functions/staking'
import { WorkingGroupKey } from '@joystream/types/common'

export default class TokenomicsTransport extends BaseTransport {
  private councilT: CouncilTransport
  private workingGroupT: WorkingGroupsTransport

  constructor(
    api: ApiPromise,
    cacheApi: APIQueryCache,
    councilTransport: CouncilTransport,
    workingGroups: WorkingGroupsTransport
  ) {
    super(api, cacheApi)
    this.councilT = councilTransport
    this.workingGroupT = workingGroups
  }

  async councilSizeAndStake() {
    let totalCouncilStake = 0
    const activeCouncil = await this.council.activeCouncil()

    activeCouncil.map((member) => {
      let stakeAmount = 0

      stakeAmount += member.stake.toNumber()
      member.backers.forEach((backer) => {
        stakeAmount += backer.stake.toNumber()
      })
      totalCouncilStake += stakeAmount
    })

    return {
      numberOfCouncilMembers: activeCouncil.length,
      totalCouncilStake,
    }
  }

  private async councilRewardsPerWeek(numberOfCouncilMembers: number) {
    const payoutInterval = Number((await this.api.query.council.payoutInterval()).unwrapOr(0))
    const amountPerPayout = (await this.api.query.council.amountPerPayout()).toNumber()
    const totalCouncilRewardsPerBlock =
      amountPerPayout && payoutInterval ? (amountPerPayout * numberOfCouncilMembers) / payoutInterval : 0

    const {
      newTermDuration,
      votingPeriod,
      revealingPeriod,
      announcingPeriod,
    } = await this.councilT.electionParameters()
    const weekInBlocks = 100800

    const councilTermDurationRatio =
      newTermDuration.toNumber() /
      (newTermDuration.toNumber() + votingPeriod.toNumber() + revealingPeriod.toNumber() + announcingPeriod.toNumber())
    const avgCouncilRewardPerBlock = councilTermDurationRatio * totalCouncilRewardsPerBlock
    const avgCouncilRewardPerWeek = avgCouncilRewardPerBlock * weekInBlocks

    return avgCouncilRewardPerWeek
  }

  async getCouncilData() {
    const { numberOfCouncilMembers, totalCouncilStake } = await this.councilSizeAndStake()
    const totalCouncilRewardsInOneWeek = await this.councilRewardsPerWeek(numberOfCouncilMembers)

    return {
      numberOfCouncilMembers,
      totalCouncilRewardsInOneWeek,
      totalCouncilStake,
    }
  }

  private async workingGroupSizeAndIds(group: WorkingGroupKey) {
    const workerStakeIds: StakeId[] = []
    const workerRewardIds: RewardRelationshipId[] = []
    let leadStakeId: StakeId | null = null
    let leadRewardId: RewardRelationshipId | null = null
    let numberOfWorkers = 0
    let leadNumber = 0
    const allWorkers = await this.workingGroupT.allWorkers(group)
    const currentLeadId = (await this.workingGroupT.currentLeadId(group))?.toNumber()

    allWorkers.forEach(([workerId, worker]) => {
      const stakeId = worker.role_stake_profile.isSome ? worker.role_stake_profile.unwrap().stake_id : null
      const rewardId = worker.reward_relationship.unwrapOr(null)

      if (currentLeadId !== undefined && currentLeadId === workerId.toNumber()) {
        leadStakeId = stakeId
        leadRewardId = rewardId
        leadNumber += 1
      } else {
        numberOfWorkers += 1

        if (stakeId) {
          workerStakeIds.push(stakeId)
        }

        if (rewardId) {
          workerRewardIds.push(rewardId)
        }
      }
    })

    return {
      numberOfWorkers,
      workerStakeIds,
      workerRewardIds,
      leadNumber,
      leadRewardId,
      leadStakeId,
    }
  }

  private async resolveGroupStakeAndRewards(
    workerStakeIds: StakeId[],
    leadStakeId: StakeId | null,
    workerRewardIds: RewardRelationshipId[],
    leadRewardId: RewardRelationshipId | null
  ) {
    let workersStake = 0
    let leadStake = 0
    let workersRewardsPerBlock = 0
    let leadRewardsPerBlock = 0

    ;(await this.api.query.stake.stakes.multi<Stake>(workerStakeIds)).forEach((stake) => {
      workersStake += stake.value.toNumber()
    })
    ;(await this.api.query.recurringRewards.rewardRelationships.multi<RewardRelationship>(workerRewardIds)).map(
      (rewardRelationship) => {
        const amount = rewardRelationship.amount_per_payout.toNumber()
        const payoutInterval = rewardRelationship.payout_interval.isSome
          ? rewardRelationship.payout_interval.unwrap().toNumber()
          : null

        if (amount && payoutInterval) {
          workersRewardsPerBlock += amount / payoutInterval
        }
      }
    )

    if (leadStakeId !== null) {
      leadStake += (await this.api.query.stake.stakes(leadStakeId)).value.toNumber()
    }

    if (leadRewardId !== null) {
      const leadRewardData = await this.api.query.recurringRewards.rewardRelationships(leadRewardId)
      const leadAmount = leadRewardData.amount_per_payout.toNumber()
      const leadRewardInterval = leadRewardData.payout_interval.isSome
        ? leadRewardData.payout_interval.unwrap().toNumber()
        : null

      if (leadAmount && leadRewardInterval) {
        leadRewardsPerBlock += leadAmount / leadRewardInterval
      }
    }

    return {
      workersStake,
      leadStake,
      workersRewardsPerWeek: workersRewardsPerBlock * 100800,
      leadRewardsPerWeek: leadRewardsPerBlock * 100800,
    }
  }

  async getWorkingGroupData(group: WorkingGroupKey) {
    const {
      numberOfWorkers,
      leadNumber,
      workerStakeIds,
      workerRewardIds,
      leadRewardId,
      leadStakeId,
    } = await this.workingGroupSizeAndIds(group)
    const {
      workersStake,
      leadStake,
      workersRewardsPerWeek,
      leadRewardsPerWeek,
    } = await this.resolveGroupStakeAndRewards(workerStakeIds, leadStakeId, workerRewardIds, leadRewardId)

    return {
      numberOfWorkers,
      leadNumber,
      workersStake,
      leadStake,
      workersRewardsPerWeek,
      leadRewardsPerWeek,
    }
  }

  async validatorSizeAndStake() {
    const validatorIds = await this.api.query.session.validators()
    const currentEra = (await this.api.query.staking.currentEra()).unwrapOr(null)
    let totalValidatorStake = 0
    let numberOfNominators = 0

    if (currentEra !== null) {
      const validatorStakeData = await this.api.query.staking.erasStakers.multi<Exposure>(
        validatorIds.map((validatorId) => [currentEra, validatorId])
      )

      validatorStakeData.forEach((data) => {
        if (!data.total.isEmpty) {
          totalValidatorStake += data.total.toNumber()
        }

        if (!data.others.isEmpty) {
          numberOfNominators += data.others.length
        }
      })
    }

    return {
      numberOfValidators: validatorIds.length,
      numberOfNominators,
      totalValidatorStake,
    }
  }

  async getValidatorData() {
    const totalIssuance = (await this.api.query.balances.totalIssuance()).toNumber()
    const { numberOfValidators, numberOfNominators, totalValidatorStake } = await this.validatorSizeAndStake()
    const validatorRewardsPerEra = calculateValidatorsRewardsPerEra(totalValidatorStake, totalIssuance)

    return {
      totalIssuance,
      numberOfValidators,
      numberOfNominators,
      totalValidatorStake,
      validatorRewardsPerWeek: validatorRewardsPerEra * 168, // Assuming 1 era = 1h
    }
  }

  async getTokenomicsData(): Promise<TokenomicsData> {
    const { numberOfCouncilMembers, totalCouncilRewardsInOneWeek, totalCouncilStake } = await this.getCouncilData()
    const workingGroupsData = {
      storageProviders: await this.getWorkingGroupData('Storage'),
      curators: await this.getWorkingGroupData('Content'),
    }
    const {
      numberOfValidators,
      numberOfNominators,
      totalValidatorStake,
      validatorRewardsPerWeek,
      totalIssuance,
    } = await this.getValidatorData()

    const currentlyStakedTokens =
      totalCouncilStake +
      Object.values(workingGroupsData).reduce((sum, { workersStake, leadStake }) => sum + workersStake + leadStake, 0) +
      totalValidatorStake

    const totalWeeklySpending =
      totalCouncilRewardsInOneWeek +
      Object.values(workingGroupsData).reduce(
        (sum, { workersRewardsPerWeek, leadRewardsPerWeek }) => sum + workersRewardsPerWeek + leadRewardsPerWeek,
        0
      ) +
      validatorRewardsPerWeek

    const totalNumberOfActors =
      numberOfCouncilMembers +
      Object.values(workingGroupsData).reduce(
        (sum, { numberOfWorkers, leadNumber }) => sum + numberOfWorkers + leadNumber,
        0
      ) +
      numberOfValidators

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
        rewardsShare: data.leadRewardsPerWeek / totalWeeklySpending,
      },
    })

    return {
      totalIssuance,
      currentlyStakedTokens,
      totalWeeklySpending,
      totalNumberOfActors,
      validators: {
        number: numberOfValidators,
        nominators: {
          number: numberOfNominators,
        },
        rewardsPerWeek: validatorRewardsPerWeek,
        rewardsShare: validatorRewardsPerWeek / totalWeeklySpending,
        totalStake: totalValidatorStake,
        stakeShare: totalValidatorStake / currentlyStakedTokens,
      },
      council: {
        number: numberOfCouncilMembers,
        rewardsPerWeek: totalCouncilRewardsInOneWeek,
        rewardsShare: totalCouncilRewardsInOneWeek / totalWeeklySpending,
        totalStake: totalCouncilStake,
        stakeShare: totalCouncilStake / currentlyStakedTokens,
      },
      storageProviders: resolveGroupData(workingGroupsData.storageProviders),
      contentCurators: resolveGroupData(workingGroupsData.curators),
    }
  }
}
