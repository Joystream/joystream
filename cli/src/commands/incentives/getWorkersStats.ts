
import { apiModuleByGroup } from '../../Api'
import IncentivesCommandBase, { GroupByScoringPeriod, WorkersInPeriod } from '../../base/IncentivesCommandBase'
import {AvailableGroups, WorkingGroups} from '../../Types'
import { flags } from '@oclif/command'
import ExitCodes from '../../ExitCodes'
import { RewardPaidEventFieldsFragment } from 'src/graphql/generated/queries'

export default class GetWorkerStatsCommand extends IncentivesCommandBase {
  static description = 'Gets worker/lead statistics one or more groups'

  static flags = {
    termStart: flags.integer({
      required: true,
      description: 'The blockheight of the start first scoring period, eg. 43200',
    }),
    termEnd: flags.integer({
      required: true,
      description: 'The blockheight where the last period ended',
    }),
    termLength: flags.integer({
      required: true,
      description: 'The length of each term (assuming equal), in blocks',
    }),
    termOfInterest: flags.integer({
      required: false,
      description: 'The council scoring period to get the results from.',
    }),
    groupsOfInterest: flags.string({
      required: false,
      description: 'Group, or set of, groups you are interested in, eg. --groupsOfInterest=storageProviders,humanResources',
    }),
    ...IncentivesCommandBase.flags,
  }
  async run(): Promise<void> {
    let { termStart,termLength,termOfInterest,termEnd,groupsOfInterest } = this.parse(GetWorkerStatsCommand).flags
    
    const rewardSorted: RewardPaidEventFieldsFragment[][] = []
    const applicableGroups:WorkingGroups[] = []
    const apiModuleGroupNames:string[] = []
    let startBlock = termStart
    let endBlock = termEnd

    if (!groupsOfInterest) {
      AvailableGroups.forEach((workingGroup) => {
        applicableGroups.push(workingGroup)
        apiModuleGroupNames.push(apiModuleByGroup[workingGroup])
        rewardSorted.push([])
      })
    } else {
      
      const groupsOfInterestParsed:string[] = []
      groupsOfInterest.split(",").forEach((a) => {
        groupsOfInterestParsed.push(a)
      })
      for (let group of AvailableGroups) {
        const indexOfGroup = groupsOfInterestParsed.indexOf(group.toString())
        if (indexOfGroup != -1) {
          apiModuleGroupNames.push(apiModuleByGroup[group])
          rewardSorted.push([])
        }
      }
      if (apiModuleGroupNames.length != groupsOfInterestParsed.length) {
        this.error(
          `Invalid groupsOfInterest input `,
          {
            exit: ExitCodes.InvalidInput,
          }
        )
      }
    }

    const periods:number[] = [termStart]
    for (let i=termStart; i<termEnd; i+=termLength) {
      periods.push(i+termLength)
    }
    let interestingPeriod = [0,periods.length]
    if (termOfInterest && termOfInterest <= periods.length) {
      startBlock = periods[termOfInterest-1]
      endBlock = periods[termOfInterest]
      this.log(`Getting worker data for council scoring period ${termOfInterest}, that started on #${startBlock} and ended on #${endBlock}`)
      interestingPeriod = [termOfInterest-1,termOfInterest]
    } else if (termOfInterest && termOfInterest > periods.length) {
      this.error(
        `Invalid termOfInterest input `,
        {
          exit: ExitCodes.InvalidInput,
        }
      )
    } else {
      this.log(`Getting worker data for council scoring periods:`)
      for (let i=1; i<periods.length; i++) {
        this.log(`  - Period ${i} from #${periods[i-1]} to #${periods[i]}`)
      }
    }

    const rewardPaidEventsBetweenBlocks = await this.getQNApi().rewardPaidEventsBetweenBlocks(startBlock,endBlock)
    for (let workerPaid of rewardPaidEventsBetweenBlocks) {
      const indexOfGroup = apiModuleGroupNames.indexOf(workerPaid.groupId)
      if (indexOfGroup != -1) {
        rewardSorted[indexOfGroup].push(workerPaid)
      }
    }


    //const endBlockHash = await this.getBlockHash(termEnd)
    const getWorkersStats = await this.getWorkersStats()
    //console.log("getWorkersStats", JSON.stringify(getWorkersStats, null, 4))
    //const workersInMultipleRoles = []
    
    const allGroupWorkerStats:GroupByScoringPeriod[] = []
    for (let group of getWorkersStats) {
      const indexOfGroup = apiModuleGroupNames.indexOf(group.apiModuleGroupName)
      if (indexOfGroup != -1) {
        const groupWorkerStats:GroupByScoringPeriod = {
          group: group.group,
          apiModuleGroupName: group.apiModuleGroupName,
          workersInPeriods: []
        }
        for (let i=1; i<periods.length; i++) {
          const period: WorkersInPeriod = {
            scoringPeriod: i,
            blockStart: periods[i-1],
            blockEnd: periods[i],
            workersAtStart: [],
            workersAtEnd: [],
            workersHiredInPeriod: [],
            workersFiredInPeriod: [],
            workersPaidInPeriod: [],
            paymentsInPeriod: []
          }
          groupWorkerStats.workersInPeriods.push(period)
        }
        for (let worker of group.workers) {
          for (let period of groupWorkerStats.workersInPeriods) {
            const hired = worker.startRange
            const fired = worker.endRange
            if (hired > period.blockStart && hired < period.blockEnd) {
              period.workersHiredInPeriod.push(worker)
            }
            if (hired < period.blockStart && fired > period.blockStart) {
              period.workersAtStart.push(worker)
            }
            if (hired < period.blockEnd && fired > period.blockEnd) {
              period.workersAtStart.push(worker)
            }
            if (fired > period.blockStart && fired < period.blockEnd) {
              period.workersFiredInPeriod.push(worker)
            }
          }
        }
        for (let i=0; i<rewardSorted[indexOfGroup].length; i++) {
          const rewardPaid = rewardSorted[indexOfGroup][i]
          const workerId = parseInt(rewardPaid.worker.membership.id)
          for (let period of groupWorkerStats.workersInPeriods) {
            rewardPaid.inBlock
            if (rewardPaid.inBlock > period.blockStart && rewardPaid.inBlock < period.blockEnd ) {
              const indexOfWorker = period.workersPaidInPeriod.indexOf(workerId)
              if (indexOfWorker != -1) {
                period.paymentsInPeriod[indexOfWorker].push(parseInt(rewardPaid.amount) ?? 0)
              } else {
                period.workersPaidInPeriod.push(workerId)
                period.paymentsInPeriod.push([parseInt(rewardPaid.amount) ?? 0])
              }
            }
          }
        }
        allGroupWorkerStats.push(groupWorkerStats)
      }
    }
    for (let group of allGroupWorkerStats) {
      this.log(`For the ${group.group} group`)
      for (let i=interestingPeriod[0]; i<interestingPeriod[1]; i++) {
        const a = group.workersInPeriods[i]
        this.log(`in period ${a.scoringPeriod}, there were:`)
        this.log(`  ${a.workersAtStart.length} at the start of the period`)
        this.log(`  ${a.workersAtEnd.length} at the end of the period`)
        this.log(`  with ${a.workersHiredInPeriod.length} workers hired`)
        this.log(`  with ${a.workersFiredInPeriod.length} workers fired or quit`)
        this.log(`A total of ${a.workersPaidInPeriod.length} workers were paid, or attempted paid, at least once`)
        console.log("Workers paid:")
        console.log("[")
        for (let n = 0; n<a.workersPaidInPeriod.length; n++) {
          const acc = (await this.getOriginalApi().query.members.membershipById(a.workersPaidInPeriod[n])).root_account.toString()
          console.log(`  { "memberId": ${a.workersPaidInPeriod[n]}, "account": "${acc}", "payments": ${a.paymentsInPeriod[n].length}, "group": "${group.group}", "dollarReward": 0, "reward": 0 },`)
        }
        console.log("]")
      }
    }
  }
}
