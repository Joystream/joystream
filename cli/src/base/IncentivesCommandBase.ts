import WorkingGroupsCommandBase from './WorkingGroupsCommandBase'
import { WorkingGroups, AvailableGroups } from '../Types'
import { Worker, WorkerId} from '@joystream/types/working-group'
import { apiModuleByGroup } from '../Api'
import { DynamicBagCreationPolicy } from '@joystream/types/storage'
import { AllWorkerHistoryFieldsFragment, BountiesCreatedBetweenBlocksFieldsFragment, WorkingGroupOpeningsFieldsFragment, RewardPaidEventFieldsFragment, AllBountiesFieldsFragment } from 'src/graphql/generated/queries'
import axios from 'axios'


export interface BudgetStatus {
  startAmount: number,
  endAmount: number,
  refill: number,
  totalSpentOnRewards: number,
  totalSpentOnOther: number,
  groups: string[],
  apiModuleGroupNames: string[],
  groupStart: number[],
  groupEnd: number[],
  groupRefills: number[][],
  rewardSpending: number[][],
  groupDiscretionarySpending: number[][],
  workersRewards: WorkerRewarded[][],
  allWorkers: number[][],
  workersHiredDuringTerm: number[][],
  workersLeftDuringTerm: number[][],
}

export interface GroupByScoringPeriod {
  group: string,
  apiModuleGroupName: string,
  workersInPeriods: WorkersInPeriod[]
}

export interface ApplicantsForOpening {
  memberId: number,
  memberHandle: string,
  applicationId: number,
  appliedInBlock: number,
  workerId?: number,
}

export interface OpeningKeyNumbers {
  id: number,
  created: number,
  closed: number|undefined,
  status: string,
  applicants: ApplicantsForOpening[],
}

export interface GroupsOpeningsStatus {
  group: string,
  apiModuleGroupName: string,
  workersHired: number,
  keyOpeningData: OpeningKeyNumbers[],
  activeOpenings: WorkingGroupOpeningsFieldsFragment[]
}

export interface RewardPaidEventFieldsFragmentByGroup {
  group: string,
  apiModuleGroupName: string,
  rewards: RewardPaidEventFieldsFragment[]
}

export interface WorkersInPeriod {
  scoringPeriod: number,
  blockStart: number,
  blockEnd: number,
  workersAtStart: WorkerStatus[],
  workersAtEnd: WorkerStatus[],
  workersHiredInPeriod: WorkerStatus[],
  workersFiredInPeriod: WorkerStatus[],
  workersPaidInPeriod: number[],
  paymentsInPeriod: number[][],
}

export interface GroupWorkerStatus {
  group: string,
  apiModuleGroupName: string,
  workers: WorkerStatus[]
}

export interface StorageBucketData {
  bucketId: number,
  status: Object,
  workerId: undefined|number,
  isAccepting: boolean,
  endpointUrl: string,
  nodeVersion: string,
  voucher: any,
  assignedBags: number
}

export interface WorkerStatus {
  memberId: number,
  memberHandle: string,
  workerId: number,
  startRange: number,
  endRange: number
}


export interface AllEras {
  firstStart: number,
  lastEra: number,
  actualRewardSum: number,
  calculatedRewardSum: number,
  totalMemberRewards: number,
  totalNonMemberRewards: number,
  totalNominatorRewards: number,
  eraResults: EraOverview[],
  memberRewards: MemberValRewards[],
  nonMemberRewards: NonMemberValRewards[],
}

export interface SingleValidator {
  stash: string,
  totalRewards: number,
  rewardBase: number,
  ownReward: number,
  otherRewards: number[],
  totStake: number,
  ownStake: number,
  otherStakes: number[],
  slashedAmount: number
}

export interface MemberValRewards {
  stash: string,
  controller: string,
  rewardsEarned: number,
  memberId: number,
}

export interface NonMemberValRewards {
  stash: string,
  controller: string,
  rewardsEarned: number,
}

export interface EraOverview {
  eraIndex: number,
  eraTotalReward: number,
  eraTotalStake: number,
  summedStake: number,
  summedRewards: number,
  nominatorRewards: number,
  totalBalancesOfSlashesApplied: number,
  slashesIncurred: number[],
  validatorStashes: string[],
  validatorPrefs: number[],
  validatorControllers: string[],
  eraPoints: number[],
  projectedRewards: number[],
}


export interface WorkersRewardByGroup {
  groups: string[],
  apiModuleGroupNames: string[],
  workersRewards: WorkerRewarded[][],
  workersHiredDuringTerm: number[][],
  workersLeftDuringTerm: number[][],
}

export interface WorkerRewarded {
  memberHandle: string,
  memberId: number,
  workerId: number,
  rewardAccount: string,
  hiredAt: number,
  leftAt: number|null,
  activeBlocks: number,
  isLead: string,
  isActive: string,
  reward: number
}

export interface CouncilSpending {
  startAmount: number,
  endAmount: number,
  refill: number,
  totalSpentOnRewards: number,
  groupBudgetSpending: number,
  councilorRewardSpending: number,
  fundingRequestProposalSpending: number
}

export interface EligibleEarnerByContext {
  memberId: number,
  memberHandle: string,
  account: string,
  earnings: number,
  notes: string
}

export interface GroupWorkerStatus {
  group: string,
  apiModuleGroupName: string,
  workers: WorkerStatus[]
}

export interface WorkerStatus {
  memberId: number,
  memberHandle: string,
  workerId: number,
  startRange: number,
  endRange: number
}

export interface UneligibleEarnerByContext {
  memberId?: string,
  memberHandle?: string,
  account: string,
  earnings: number,
  notes: string
}

export interface EarnersByContext {
  context: string,
  earnings: number,
  eligibleEarnings: number,
  uneligibleEarnings: number,
  eligibleEarner: EligibleEarnerByContext[],
  uneligibleEarner: UneligibleEarnerByContext[],
}

export interface NonWgEarnings {
  context: string[],
  totalEarnings: number,
  totalEligibleEarnings: number,
  totalUneligibleEarnings: number,
  earningsByContext: EarnersByContext[],
  applicableJoySpending: number
}

export interface OpportunitiesScores {
  groupScores: OpportunitiesScoreData[],
  leadGroupNames: string[],
  activeLeadsWorkerIdsSorted: number[],
  leadScoringPeriodHiredSorted: number[],
  score: number,
}

export interface OpportunitiesScoreData {
  groupName: string,
  apiModuleGroupName: string,
  activeWorkerIdsSorted: number[],
  scoringPeriodHiredSorted: number[],
  score: number,
}

export default abstract class InternalCommandBase extends WorkingGroupsCommandBase {
  
  async getEraRange(startBlockHash: string, endBlockHash: string): Promise<number[]> {
    const activeEraStart = (await this.getOriginalApi().query.staking.activeEra.at(startBlockHash)).unwrap().index.toNumber()
    const activeEraEnd = (await this.getOriginalApi().query.staking.activeEra.at(endBlockHash)).unwrap().index.toNumber()
    return [activeEraStart,activeEraEnd]
  }

  async getStorageWorkersAt(hash: string): Promise<StorageBucketData[]> {
    const activeWorkersAt = await this.getOriginalApi().query.storage.storageBucketById.entriesAt(hash)
    const data:StorageBucketData[] = []
    for (let i=0; i<activeWorkersAt.length; i++) {
      const bucketId = activeWorkersAt[i][0].args[0].toNumber()
      const bucket = activeWorkersAt[i][1]
      const status: Object = JSON.parse(bucket.operator_status.toString())
      let workerId = undefined
      if (bucket.operator_status.isOfType("InvitedStorageWorker")) {
        workerId = bucket.operator_status.asType("InvitedStorageWorker").toNumber()
      } else if  (bucket.operator_status.isOfType("StorageWorker")) {
        workerId = (bucket.operator_status.asType("StorageWorker")[0] as WorkerId).toNumber()
      }
      const voucher = JSON.parse(bucket.voucher.toString())
      const assignedBags = bucket.assigned_bags.toNumber()
      data.push({
        bucketId,
        status,
        workerId,
        isAccepting: bucket.accepting_new_bags.isTrue,
        endpointUrl: "",
        nodeVersion: "",
        voucher,
        assignedBags,
      })
    }
    return data
  }

  async getLeadOfGroupAt(hash: string, group: WorkingGroups): Promise<number | undefined> {
    const leadId = await this.getApi().unprotectedWorkingGroupApiQuery(group).currentLead.at(hash)
    return leadId.unwrapOr(undefined)?.toNumber()
  }
  
  async getBlockHash(block: number): Promise<string> {
    const hashOf = await this.getApi().unprotecedBlockHash(block)
    return hashOf
  }
  
  async getTimestamps(block: number): Promise<Date> {
    const hashOf = await this.getBlockHash(block)
    const getBlock = await this.getOriginalApi().rpc.chain.getBlock(hashOf)
    const timestamp = getBlock.block.extrinsics[0].method.args[0].toString()
    const timestampQN = new Date(parseInt(timestamp))
    return timestampQN
  }

  async getBudgetAtBlockHash(group: WorkingGroups, hash: string): Promise<number> {
    const budget = await this.getApi().unprotectedWorkingGroupApiQuery(group).budget.at(hash)
    return budget.toNumber()
  }
  async getCouncilBudgetAtBlockHash(hash: string): Promise<number> {
    const budget = await this.getOriginalApi().query.council.budget.at(hash)
    return budget.toNumber()
  }

  async getNextWorkerAt(group: WorkingGroups, hash: string): Promise<number> {
    const nextWorkerId = await this.getApi().unprotectedWorkingGroupApiQuery(group).nextWorkerId.at(hash)
    return nextWorkerId.toNumber()
  }

  async getWorkerAt(group: WorkingGroups, hash: string, workerId: number): Promise<Worker> {
    const workerById = await this.getApi().unprotectedWorkingGroupApiQuery(group).workerById.at(hash,workerId)
    return workerById
  }

  async getAllBudgetStatusInRange(budgetSpending:BudgetStatus, startBlockHashPlusOne: string, endBlockHash: string): Promise<BudgetStatus> {
    const allWorkingGroups = AvailableGroups
    for (let workingGroup of allWorkingGroups) {
      const apiModuleGroupName = apiModuleByGroup[workingGroup]
      budgetSpending.groups.push(workingGroup.toString())
      budgetSpending.apiModuleGroupNames.push(apiModuleGroupName.toString())
      budgetSpending.groupStart.push(await this.getBudgetAtBlockHash(workingGroup, startBlockHashPlusOne))
      budgetSpending.groupEnd.push(await this.getBudgetAtBlockHash(workingGroup, endBlockHash))
      budgetSpending.groupRefills.push([])
      budgetSpending.rewardSpending.push([])
      budgetSpending.groupDiscretionarySpending.push([])
      budgetSpending.workersRewards.push([])
      budgetSpending.allWorkers.push([])
      budgetSpending.workersHiredDuringTerm.push([])
      budgetSpending.workersLeftDuringTerm.push([])
    }
    budgetSpending.groups.push("council")
    budgetSpending.groupStart.push(await this.getCouncilBudgetAtBlockHash(startBlockHashPlusOne))
    budgetSpending.groupEnd.push(await this.getCouncilBudgetAtBlockHash(endBlockHash))
    budgetSpending.groupRefills.push([])
    budgetSpending.rewardSpending.push([])
    budgetSpending.groupDiscretionarySpending.push([])
    budgetSpending.workersRewards.push([])
    budgetSpending.allWorkers.push([])
    budgetSpending.workersHiredDuringTerm.push([])
    budgetSpending.workersLeftDuringTerm.push([])
    return budgetSpending
  }


  async getColossusData(url: string, specificOutput?: string): Promise<any> {
    let appendUrl = 'api/v1/'
    if (specificOutput) {
      appendUrl = appendUrl+specificOutput
    } else {
      appendUrl = appendUrl+'state/data'
    }
    let apiUrl = ""
    if (url.slice(-1) != "/") {
      apiUrl = url+'/'+appendUrl
    } else {
      apiUrl = url+appendUrl
    }
    try {
      const info = await axios.get(`${apiUrl}`, {
        headers: {
          connection: 'close',
        },
      })
      return info.data
    } catch (err) {
      return "not reachable"
    }
  }

  async getArgusData(url: string): Promise<any> {
    let appendUrl = 'api/v1/status'
    let apiUrl = ""
    if (url.slice(-1) != "/") {
      apiUrl = url+'/'+appendUrl
    } else {
      apiUrl = url+appendUrl
    }
    try {
      const info = await axios.get(`${apiUrl}`, {
        headers: {
          connection: 'close',
        },
      })
      return info.data
    } catch (err) {
      return "not reachable"
    }
  }

  async getWorkersStats(): Promise<GroupWorkerStatus[]> {
    const allWorkingGroups = AvailableGroups
    const apiModuleGroupName: string[] = []
    const groupWorkerStatus: GroupWorkerStatus[] = []
    for (let workingGroup of allWorkingGroups) {
      apiModuleGroupName.push(apiModuleByGroup[workingGroup].toString())
      groupWorkerStatus.push({
        group: workingGroup.toString(),
        apiModuleGroupName: apiModuleByGroup[workingGroup].toString(),
        workers: []
      })
    }
    const workerHistory = await this.getQNApi().workerHistory()
    for (let worker of workerHistory) {
      const groupIndex = apiModuleGroupName.indexOf(worker.groupId)
      if (groupIndex != -1) {
        const workerInGroup:WorkerStatus = {
          memberId: parseInt(worker.membership.id),
          memberHandle: worker.membership.handle,
          workerId: worker.runtimeId,
          startRange: worker.entry.inBlock,
          endRange: 0
        }
      workerInGroup.endRange = await this.getWorkerLeftBlock(worker)
      groupWorkerStatus[groupIndex].workers.push(workerInGroup)
      }
    }
    return groupWorkerStatus
  }

  async getWorkerLeftBlock(worker: AllWorkerHistoryFieldsFragment): Promise<number> {
    let leftBlock = 0
    if (worker.leaderunseteventleader) {
      if (worker.leaderunseteventleader.length > 0 ) {
        leftBlock = worker.leaderunseteventleader[0].inBlock
      }
    }
    if (worker.status.__typename === "WorkerStatusTerminated") {
      if (worker.status.terminatedWorkerEvent) {
        leftBlock = worker.status.terminatedWorkerEvent.inBlock
      }
    } else if (worker.status.__typename === "WorkerStatusLeft") {
      if (worker.status.workerExitedEvent) {
        leftBlock = worker.status.workerExitedEvent.inBlock
      }
    } else if (worker.status.__typename === "WorkerStatusLeaving") {
      if (worker.status.workerStartedLeavingEvent) {
        leftBlock = worker.status.workerStartedLeavingEvent.inBlock
      }
    }
    return leftBlock
  }


  async getWorkersInGroup(spend: BudgetStatus, startBlock: number, endBlock: number): Promise<BudgetStatus> {
    const workerHistory = await this.getQNApi().workerHistory()
    for (let worker of workerHistory) {
      const indexOfGroup = spend.apiModuleGroupNames.indexOf(worker.groupId)
      const relevantWorker: WorkerRewarded = {
        memberHandle: worker.membership.handle,
        memberId: parseInt(worker.membership.id),
        workerId: worker.runtimeId,
        rewardAccount: worker.rewardAccount,
        hiredAt: worker.entry.inBlock,
        leftAt: 0,
        activeBlocks: endBlock-startBlock,
        isLead: worker.isLead.toString(),
        isActive: worker.isActive.toString(),
        reward: 0
      }
      for (let slash of worker.slashes) {
        if (slash.inBlock > startBlock && slash.inBlock < endBlock) {
          relevantWorker.reward -= parseInt(slash.slashedAmount)
        }
      }
      if (worker.isActive == true) {
        if (worker.entry.inBlock < endBlock) {
          if (worker.entry.inBlock > startBlock) {
            spend.workersHiredDuringTerm[indexOfGroup].push(worker.runtimeId)
          }
          spend.workersRewards[indexOfGroup].push(relevantWorker)
          spend.allWorkers[indexOfGroup].push(worker.runtimeId)
        }
      }
      if (worker.leaderunseteventleader) {
        if (worker.leaderunseteventleader.length > 0 ) {
          const leftBlock = worker.leaderunseteventleader[0].inBlock
          relevantWorker.leftAt = leftBlock
          if (leftBlock > startBlock) {
            if (leftBlock < endBlock) {
              relevantWorker.isActive = "true"
            } else {
              spend.workersLeftDuringTerm[indexOfGroup].push(worker.runtimeId)
            }
            spend.workersRewards[indexOfGroup].push(relevantWorker)
            spend.allWorkers[indexOfGroup].push(worker.runtimeId)
          }
        }
      }
      if (worker.status.__typename === "WorkerStatusTerminated") {
        if (worker.status.terminatedWorkerEvent) {
          const leftBlock = worker.status.terminatedWorkerEvent.inBlock
          relevantWorker.leftAt = leftBlock
          if (leftBlock > startBlock) {
            if (leftBlock < endBlock) {
              relevantWorker.isActive = "true"
            } else {
              spend.workersLeftDuringTerm[indexOfGroup].push(worker.runtimeId)
            }
            spend.workersRewards[indexOfGroup].push(relevantWorker)
            spend.allWorkers[indexOfGroup].push(worker.runtimeId)
          }
        }
      } else if (worker.status.__typename === "WorkerStatusLeft") {
        if (worker.status.workerExitedEvent) {
          const leftBlock = worker.status.workerExitedEvent.inBlock
          relevantWorker.leftAt = leftBlock
          if (leftBlock > startBlock) {
            if (leftBlock < endBlock) {
              relevantWorker.isActive = "true"
            } else {
              spend.workersLeftDuringTerm[indexOfGroup].push(worker.runtimeId)
            }
            spend.workersRewards[indexOfGroup].push(relevantWorker)
            spend.allWorkers[indexOfGroup].push(worker.runtimeId)
          }
        }
      }
      if (relevantWorker.leftAt && relevantWorker.isActive === "true") {
        if (relevantWorker.hiredAt > startBlock) {
          relevantWorker.activeBlocks = relevantWorker.leftAt - relevantWorker.hiredAt
        } else {
          relevantWorker.activeBlocks = relevantWorker.leftAt - startBlock
        }
      } else {
        if (relevantWorker.hiredAt > startBlock) {
          relevantWorker.activeBlocks = endBlock - relevantWorker.hiredAt
        }
      }
    }
    return spend
  }

  async getRelevantWorkers(endBlock: number, groupIdInput: string): Promise<WorkerStatus[]> {
    const workerHistory = await this.getQNApi().workerHistory()
    const groupWorkers = workerHistory.filter(({groupId}) => groupId === groupIdInput )
    const groupWorkersAtBlock: WorkerStatus[] = []
    for (let worker of groupWorkers) {
      let endRange = endBlock
      if (worker.isActive == false) {
        if (worker.status.__typename === "WorkerStatusTerminated") {
          if (worker.status.terminatedWorkerEvent) {
            endRange = worker.status.terminatedWorkerEvent.inBlock
          }
        } else if (worker.status.__typename === "WorkerStatusLeft") {
          if (worker.status.workerExitedEvent) {
            endRange = worker.status.workerExitedEvent.inBlock
          }
        }
      }
      const workerInGroup: WorkerStatus = {
        memberId: parseInt(worker.membership.id),
        memberHandle: worker.membership.handle,
        workerId: worker.runtimeId,
        startRange: worker.entry.inBlock,
        endRange
      }
      groupWorkersAtBlock.push(workerInGroup)
    }
    groupWorkersAtBlock.sort((a,b) => a.workerId-b.workerId)
    return groupWorkersAtBlock
  }

  async getDynamicBagCreationPoliciesAt(hash: string, bagType: "Channel"|"Member"):Promise<DynamicBagCreationPolicy> {
    const policy = await this.getOriginalApi().query.storage.dynamicBagCreationPolicies.at(hash,bagType)
    return policy
  }
    

  async getEraResults(eraIndex: number, blockHash:string): Promise<EraOverview> {
    const eraRewardPoints = await this.getOriginalApi().query.staking.erasRewardPoints.at(blockHash,eraIndex)
    const eraTotalReward  = (await this.getOriginalApi().query.staking.erasValidatorReward.at(blockHash,eraIndex)).unwrap().toNumber()
    const eraTotalStake  = (await this.getOriginalApi().query.staking.erasTotalStake.at(blockHash,eraIndex)).toNumber()
    const validatorStashes:string[] = []
    const points:number[] = []
    const prefs:number[] = []
    const projectedRewards:number[] = []
    const slashesIncurred:number[] = []
    let totalBalancesOfSlashesApplied:number = 0
    const validatorWithNominators:SingleValidator[] = []
    eraRewardPoints.individual.forEach((a,b) => {
      validatorStashes.push(b.toString())
      points.push(a.toNumber())
    })
    let summedRewards = 0
    let summedStake = 0
    let nominatorRewards = 0
    for (let i=0; i<validatorStashes.length; i++) {
      const pref = (await this.getOriginalApi().query.staking.erasValidatorPrefs.at(blockHash,eraIndex,validatorStashes[i])).commission.toNumber()/10**9
      prefs.push(pref)
    
      const stakers = await this.getOriginalApi().query.staking.erasStakers.at(blockHash,eraIndex,validatorStashes[i])
      const rewardBase = Math.round(eraTotalReward * points[i]/eraRewardPoints.total.toNumber())
      const sharedRewards = rewardBase * (1-pref)
      const ownReward = Math.round((stakers.own.toNumber()/stakers.total.toNumber())*sharedRewards + (rewardBase-sharedRewards))
      summedRewards += ownReward
      projectedRewards.push(ownReward)

      const val: SingleValidator = {
        stash: validatorStashes[i],
        rewardBase,
        totalRewards: ownReward,
        ownReward,
        otherRewards: [],
        totStake: stakers.total.toNumber(),
        ownStake: stakers.own.toNumber(),
        otherStakes: [],
        slashedAmount: 0
      }
      summedStake += stakers.total.toNumber()
      stakers.others.forEach((a) => {
        val.totalRewards += Math.round(sharedRewards*a.value.toNumber()/stakers.total.toNumber())
        val.otherRewards.push(Math.round(sharedRewards*a.value.toNumber()/stakers.total.toNumber()))
        val.otherStakes.push(a.value.toNumber())
        summedRewards += Math.round(sharedRewards*a.value.toNumber()/stakers.total.toNumber())
        nominatorRewards += Math.round(sharedRewards*a.value.toNumber()/stakers.total.toNumber())
      });
      validatorWithNominators.push(val)
      const validatorSlashInEra = await this.getOriginalApi().query.staking.validatorSlashInEra.at(blockHash,eraIndex,val.stash)
      const unwrappedValidatorSlashInEra = validatorSlashInEra.unwrapOr(undefined)
      if (unwrappedValidatorSlashInEra) {
        val.slashedAmount += unwrappedValidatorSlashInEra[1].toNumber()
        totalBalancesOfSlashesApplied += unwrappedValidatorSlashInEra[1].toNumber()
        slashesIncurred.push(unwrappedValidatorSlashInEra[1].toNumber())
        this.log(`Slashing of validator ${val.stash} in era ${eraIndex} - amount: ${val.slashedAmount}`)
      } else {
        slashesIncurred.push(0)
      }
    }
      const nominatorSlashInEra = await this.getOriginalApi().query.staking.nominatorSlashInEra.entriesAt(blockHash,eraIndex)
        
      nominatorSlashInEra.forEach((a) => {
        const slash = a[1].unwrap().toNumber()
        this.log(`Slashing of nominator in era ${eraIndex} - amount: ${slash}`)
        totalBalancesOfSlashesApplied += slash
      })
    const validatorControllers: string[] = []
    for (let stash of validatorStashes) {
      validatorControllers.push((await this.getOriginalApi().query.staking.bonded.at(blockHash,stash)).toString())
    }
    const eraOverview: EraOverview = {
      eraIndex,
      eraTotalReward,
      eraTotalStake,
      summedStake,
      summedRewards,
      nominatorRewards,
      totalBalancesOfSlashesApplied,
      slashesIncurred,
      validatorStashes,
      validatorPrefs: prefs,
      validatorControllers,
      eraPoints: points,
      projectedRewards,
    }
    return eraOverview
  }

  async getFundingRequestsExecuted(startBlock:number,endBlock:number): Promise<EarnersByContext> {
    const proposalExecutedEventsBetweenBlocks = await this.getQNApi().proposalExecutedEventsBetweenBlocks(startBlock,endBlock)
    const proposalEarners: EarnersByContext = {
      context: "proposal",
      earnings: 0,
      eligibleEarnings: 0,
      uneligibleEarnings: 0,
      eligibleEarner: [],
      uneligibleEarner: []
    }
    for (let proposal of proposalExecutedEventsBetweenBlocks) {
      if (proposal.proposal.details.__typename === "FundingRequestProposalDetails" && proposal.proposal.details.destinationsList) {
        for (let recipient of proposal.proposal.details.destinationsList.destinations) {
          const amountPaid = parseInt(recipient.amount) ?? 0
          proposalEarners.earnings += amountPaid
          proposalEarners.eligibleEarnings += amountPaid
          const recipientRootIsMember = await this.getQNApi().membersByRootAccounts([recipient.account])
          if (recipientRootIsMember.length == 1) {
            const proposalEarner:EligibleEarnerByContext = {
              memberId: parseInt(recipientRootIsMember[0].id),
              memberHandle: recipientRootIsMember[0].handle,
              account: recipient.account,
              earnings: amountPaid,
              notes: `Awarded ${amountPaid} in proposal ${proposal.proposal.id}`
            }
            proposalEarners.eligibleEarner.push(proposalEarner)
          } else {
            const recipientControllerIsMember = await this.getQNApi().membersByControllerAccounts([recipient.account])
            if (recipientControllerIsMember.length == 1) {
              const proposalEarner:EligibleEarnerByContext = {
                memberId: parseInt(recipientControllerIsMember[0].id),
                memberHandle: recipientControllerIsMember[0].handle,
                account: recipient.account,
                earnings: recipient.amount,
                notes: `Awarded ${recipient.amount} in proposal ${proposal.proposal.id}`
              }
              proposalEarners.eligibleEarner.push(proposalEarner)
              proposalEarners.eligibleEarner += recipient.amount
            } else {
              const proposalEarner: UneligibleEarnerByContext = {
                account: recipient.account,
                earnings: recipient.amount,
                notes: `Awarded ${recipient.amount} in proposal ${proposal.proposal.id}`
              }
              proposalEarners.uneligibleEarner.push(proposalEarner)
              proposalEarners.uneligibleEarnings += recipient.amount
            }
          }
        }
      }
    }
    return proposalEarners
  }

  async getBountyEarners(startBlock: number, endBlock: number): Promise<EarnersByContext> {
    const hrGroup = apiModuleByGroup[WorkingGroups.HumanResources]
    const hrWorkers = await this.getRelevantWorkers(endBlock,hrGroup)
    const bountiesPaid = await this.getQNApi().oracleJudgmentSubmittedEventsBetweenBlocks(startBlock,endBlock)
    const workerIds:number[] = []
    const workerRange:[number,number][] = []
    const bountyEarners: EarnersByContext = {
      context: "bounties",
      earnings: 0,
      eligibleEarnings: 0,
      uneligibleEarnings: 0,
      eligibleEarner: [],
      uneligibleEarner: []
    }
    for (let worker of hrWorkers) {
      workerIds.push(worker.memberId)
      workerRange.push([worker.startRange,worker.endRange])
    }
    for (let bounty of bountiesPaid) {
      const creator = bounty.bounty.creator
      if (creator) {
        const createdAtBlockHash = await this.getBlockHash(bounty.inBlock)
        const bountyWorkersAt = await this.getOriginalApi().query.operationsWorkingGroupBeta.workerById.entriesAt(createdAtBlockHash)
        const createdByHR:number[] = []
        bountyWorkersAt.forEach(([a,b]) => {
          const workerId = a.args[0].toNumber()
          const workerMember = b.member_id.toNumber()
          if (workerMember == parseInt(creator.id)) {
            createdByHR.push(workerMember,workerId)
          }
        })
        if (createdByHR.length > 0) {
          const bountyWinners = bounty.bounty.entries
          if (bountyWinners) {
            for (let winner of bountyWinners) {
              const reward = winner.status.reward
              if (reward) {
                bountyEarners.earnings += winner.status.reward
                bountyEarners.eligibleEarnings += winner.status.reward
                bountyEarners.eligibleEarner.push({
                  memberId: parseInt(winner.worker.id),
                  memberHandle: winner.worker.handle,
                  account: winner.stakingAccount ?? "na",
                  earnings: winner.status.reward,
                  notes: `BountyId: ${bounty.bounty.id}. Created by memberId ${createdByHR[0]} with workerId ${createdByHR[1]} in block ${bounty.bounty.createdInEvent.inBlock} Paid in block: ${bounty.inBlock}`
                })
              }
            }
          }
        }
      }
    }
    return bountyEarners
  }

  async getBountiesCreated(startBlock: number, endBlock: number): Promise<BountiesCreatedBetweenBlocksFieldsFragment[]> {
    const hrGroup = apiModuleByGroup[WorkingGroups.HumanResources]
    const hrWorkers = await this.getRelevantWorkers(endBlock,hrGroup)
    const bountiesCreated = await this.getQNApi().bountiesCreatedBetweenBlocks(startBlock,endBlock)
    const workerIds:number[] = []
    const workerRange:[number,number][] = []
    const bountiesCreatedByHR: BountiesCreatedBetweenBlocksFieldsFragment[] = []
    for (let worker of hrWorkers) {
      workerIds.push(worker.memberId)
      workerRange.push([worker.startRange,worker.endRange])
    }
    for (let bounty of bountiesCreated) {
      const creator = bounty.bounty.creator
      if (creator) {
        const createdAtBlockHash = await this.getBlockHash(bounty.inBlock)
        const bountyWorkersAt = await this.getOriginalApi().query.operationsWorkingGroupBeta.workerById.entriesAt(createdAtBlockHash)
        bountyWorkersAt.forEach(([a,b]) => {
          const workerMember = b.member_id.toNumber()
          if (workerMember == parseInt(creator.id)) {
            bountiesCreatedByHR.push(bounty)
          }
        })
      }
    }
    return bountiesCreatedByHR
  }

  async getAllBountyData(startBlock: number, endBlock: number) {
    const allBounties = await this.getQNApi().allBounties()
    console.log(allBounties)
    const bountiesCreatedByHR: AllBountiesFieldsFragment[] = []
    for (let bounty of allBounties) {
      if (bounty.createdInEvent.inBlock > startBlock && bounty.createdInEvent.inBlock < endBlock) {
        const creator = bounty.creator
        if (creator) {
          const createdAtBlockHash = await this.getBlockHash(bounty.createdInEvent.inBlock)
          const bountyWorkersAt = await this.getOriginalApi().query.operationsWorkingGroupBeta.workerById.entriesAt(createdAtBlockHash)
          bountyWorkersAt.forEach((a) => {
            //const workerId = a.args[0].toNumber()
            const workerMember = a[1].member_id.toNumber()
            if (workerMember == parseInt(creator.id)) {
              bountiesCreatedByHR.push(bounty)
            }
          })
        }
      }
    }
    //for (let bounty of bountiesCreatedByHR) {
    //}
  }
}