import { apiModuleByGroup } from '../../Api'
import IncentivesCommandBase, { GroupsOpeningsStatus, OpeningKeyNumbers } from '../../base/IncentivesCommandBase'
import {AvailableGroups, WorkingGroups} from '../../Types'
import { flags } from '@oclif/command'
import ExitCodes from '../../ExitCodes'


export default class GetOpeningsStatsCommand extends IncentivesCommandBase {
  static description = 'Gets worker/lead statistics one or more groups'

  static flags = {
    startBlock: flags.integer({
      required: true,
      description: 'The blockheight of the start first scoring period, eg. 43200',
    }),
    endBlock: flags.integer({
      required: true,
      description: 'The blockheight where the last period ended',
    }),
    groupsOfInterest: flags.string({
      required: false,
      description: 'Group, or set of, groups you are interested in, eg. --groupsOfInterest=storageProviders,humanResources',
    }),
    ...IncentivesCommandBase.flags,
  }
  async run(): Promise<void> {
    let { startBlock,endBlock,groupsOfInterest } = this.parse(GetOpeningsStatsCommand).flags
    
    const relevantOpenings: GroupsOpeningsStatus[] = []
    const applicableGroups:WorkingGroups[] = []
    const apiModuleGroupNames:string[] = []


    if (!groupsOfInterest) {
      AvailableGroups.forEach((workingGroup) => {
        applicableGroups.push(workingGroup)
        apiModuleGroupNames.push(apiModuleByGroup[workingGroup])
        const relevantGroup:GroupsOpeningsStatus = {
          group: workingGroup.toString(),
          apiModuleGroupName: apiModuleByGroup[workingGroup],
          workersHired: 0,
          keyOpeningData: [],
          activeOpenings: []
        }
        relevantOpenings.push(relevantGroup)
      })
    } else {
      const groupsOfInterestParsed:string[] = []
      groupsOfInterest.split(",").forEach((a) => {
        groupsOfInterestParsed.push(a)
        console.log(a)
      })
      for (let workingGroup of AvailableGroups) {
        const indexOfGroup = groupsOfInterestParsed.indexOf(workingGroup.toString())
        if (indexOfGroup != -1) {
          apiModuleGroupNames.push(apiModuleByGroup[workingGroup])
          applicableGroups.push(workingGroup)
          const relevantGroup:GroupsOpeningsStatus = {
            group: workingGroup.toString(),
            apiModuleGroupName: apiModuleByGroup[workingGroup],
            workersHired: 0,
            keyOpeningData: [],
            activeOpenings: []
          }
          relevantOpenings.push(relevantGroup)
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
    
    const allOpenings = await this.getQNApi().allWorkingGroupOpenings()
    for (let opening of allOpenings) {
      const indexOfGroup = apiModuleGroupNames.indexOf(opening.groupId)
      let workersHired = 0
      if (opening.type == "REGULAR") {
        if (indexOfGroup != -1) {
          const keyOpeningDataOpeningKeyNumbers:OpeningKeyNumbers = {
            id: opening.runtimeId,
            created: opening.createdInEvent.inBlock,
            closed: undefined,
            status: opening.status.__typename,
            applicants: [],
          }
          const applicantIds:number[] = []
          opening.applications.forEach((a) => {
            applicantIds.push(a.runtimeId)
            keyOpeningDataOpeningKeyNumbers.applicants.push({
              memberId: parseInt(a.applicant.id),
              memberHandle: a.applicant.handle,
              applicationId: a.runtimeId,
              appliedInBlock: a.createdInEvent.inBlock
            })
          })
          const status = opening.status.__typename
          
          if (status == "OpeningStatusOpen") {
          } else if (status == "OpeningStatusFilled" && opening.status.openingFilledEvent ) {
            if (opening.status.openingFilledEvent.inBlock < endBlock) {
              keyOpeningDataOpeningKeyNumbers.closed = opening.status.openingFilledEvent.inBlock
              for (let workerHired of opening.status.openingFilledEvent.workersHired) {
                workersHired += 1
                const applicationId = parseInt(workerHired.applicationId.slice(opening.groupId.length+1))
                const applicationIdIndex = applicantIds.indexOf(applicationId)
                keyOpeningDataOpeningKeyNumbers.applicants[applicationIdIndex].workerId = workerHired.runtimeId
              }
            }
          } else if (status == "OpeningStatusCancelled" && opening.status.openingCanceledEvent ) {
            if (opening.status.openingCanceledEvent.inBlock < endBlock) {
              keyOpeningDataOpeningKeyNumbers.closed = opening.status.openingCanceledEvent.inBlock
            }
          }
          if (keyOpeningDataOpeningKeyNumbers.closed && keyOpeningDataOpeningKeyNumbers.closed > startBlock) {
            relevantOpenings[indexOfGroup].keyOpeningData.push(keyOpeningDataOpeningKeyNumbers)
            relevantOpenings[indexOfGroup].workersHired += workersHired
            relevantOpenings[indexOfGroup].activeOpenings.push(opening)
          } else if (!keyOpeningDataOpeningKeyNumbers.closed && keyOpeningDataOpeningKeyNumbers.created < endBlock) {
            relevantOpenings[indexOfGroup].keyOpeningData.push(keyOpeningDataOpeningKeyNumbers)
            relevantOpenings[indexOfGroup].workersHired += workersHired
            relevantOpenings[indexOfGroup].activeOpenings.push(opening)
          }
        }
      } 
    }
    console.log(`relevantOpenings`,JSON.stringify(relevantOpenings, null, 4))
  }
}
