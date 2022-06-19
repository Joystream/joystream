
import { apiModuleByGroup } from '../../Api'
import IncentivesCommandBase from '../../base/IncentivesCommandBase'
import {AvailableGroups} from '../../Types'
import { flags } from '@oclif/command'
import ExitCodes from '../../ExitCodes'


export default class GetOpportunitiesScoreCommand extends IncentivesCommandBase {
  static description = 'Gets stats'

  static flags = {
    termStart: flags.integer({
      char: 's',
      required: true,
      description: 'The blockheight of the start first scoring period, eg. 43200',
    }),
    termEnd: flags.integer({
      char: 'e',
      required: true,
      description: 'The blockheight where the last period ended',
    }),
    termLength: flags.integer({
      char: 'l',
      required: true,
      description: 'The length of each term (assuming equal), in blocks',
    }),
    groupTargets: flags.string({
      char: 't',
      required: true,
      description: 'Comma seperated targets for each group',
    }),
    groupsCounted: flags.string({
      char: 'c',
      required: true,
      description: 'Comma seperated list of the groups that "counts" for the term',
    }),
    ...IncentivesCommandBase.flags,
  }
  async run(): Promise<void> {
    let { termStart,termLength,termEnd,groupsCounted, groupTargets } = this.parse(GetOpportunitiesScoreCommand).flags
    
    const targets:number[] = []
    groupTargets.split(",").forEach((a) => {
      targets.push(100-parseInt(a))
    })
    const applicableGroups:string[] = []
    groupsCounted.split(",").forEach((a) => {
      applicableGroups.push(a)
    })
    const periods:number[] = [termStart]
    for (let i=termStart; i<termEnd; i+=termLength) {
      periods.push(i+termLength)
    }
    if (targets.length !== applicableGroups.length) {
      this.error(`The amount of groups and targets should be equal: Targets: ${targets.length} Got: ${applicableGroups.length}!`, {
        exit: ExitCodes.InvalidInput,
      })
    } else {
      this.log(
`This will provide the opportunity scores for round ${periods.length-1},
between blocks ${periods[periods.length-2]} and ${periods[periods.length-1]},
with:`)
      for (let i=0; i<targets.length; i++) {
        this.log(`Group: ${applicableGroups[i]}, target: ${100-targets[i]}`)
      }
    }
    for (let i=1; i<periods.length; i++) {
      console.log("i, periods[i]",i, periods[i-1], periods[i])
    }
    const allWorkingGroups = AvailableGroups
    const endBlockHash = await this.getBlockHash(termEnd)
    const leads: [string,number,number,number,number,number][] = []
    for (let workingGroup of allWorkingGroups) {
      const indexOfGroup = applicableGroups.indexOf(workingGroup.toString())
      if (indexOfGroup != -1) {
        const apiModuleGroupName = apiModuleByGroup[workingGroup]
        const target = targets[indexOfGroup]
        const allWorkersByGroup = await this.getRelevantWorkers(termEnd,apiModuleGroupName)
        const hires = allWorkersByGroup.filter((a) => a.startRange > periods[periods.length-2])
        const firings = allWorkersByGroup.filter((a) => (a.endRange > periods[periods.length-2] && a.endRange < periods[periods.length-1]))
        console.log("Group: Hires/Fires",workingGroup.toString(),hires.length,firings.length)
        const workersByGroup = allWorkersByGroup.filter((a) => a.endRange > periods[periods.length-2])
        const leadAtEnd = await this.getLeadOfGroupAt(endBlockHash,workingGroup)
        const workersInGroup: [number,number,number,number,number][] = []
        for (let worker of workersByGroup) {
          for (let i=1; i<periods.length; i++) {
            if (worker.startRange > periods[i-1] && worker.startRange < periods[i]) {
              if (worker.workerId === leadAtEnd && leadAtEnd) {
                leads.push([workingGroup.toString(), worker.workerId, worker.startRange,worker.endRange,i,(periods.length-1-i)])
              } else {
                workersInGroup.push([worker.workerId,worker.startRange,worker.endRange,i,(periods.length-1-i)])
              }
            }
          }
        }
        const ordinalRank = Math.ceil(target*workersInGroup.length/100)
        const WORKER_OPPORTUNITIES_SCORE = Math.min(Math.max((1/(workersInGroup[ordinalRank-1][4])),0),1)
        this.log(`The WORKER_OPPORTUNITIES_SCORE for ${workingGroup.toString()}, given a target of ${100-target}, is ${WORKER_OPPORTUNITIES_SCORE}`)
        console.log(`Given the set of workers active during the period: workerId, hiredInBlock, leftAtBlock (or last block of period), hiredInTerm, numberOfTermsInGroup`)
        console.log(JSON.stringify(workersInGroup,null,4))
      }
    }
    if (leads.length > 1) {
      leads.sort((a,b) => b[2]-a[2])
      const LEAD_OPPORTUNITIES_SCORE = 1/leads[0][5]
      this.log(`The LEAD_OPPORTUNITIES_SCORE is ${LEAD_OPPORTUNITIES_SCORE}, as the lead of the ${leads[0][0]} has had the position for the fewest amount of Council Periods`)
      console.log(`Given the set of leads active during the period, with: group, workerId, hiredInBlock, leftAtBlock (or last block of period), hiredInTerm, numberOfTermsInGroup`)
      console.log(JSON.stringify(leads,null,4))
    }
  }
}
