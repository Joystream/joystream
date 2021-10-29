import ExitCodes from '../ExitCodes'
import AccountsCommandBase from './AccountsCommandBase'
import { flags } from '@oclif/command'
import {
  WorkingGroups,
  AvailableGroups,
  NamedKeyringPair,
  GroupMember,
  GroupOpening,
  OpeningStatus,
  GroupApplication,
} from '../Types'
import _ from 'lodash'
import { ApplicationStageKeys } from '@joystream/types/hiring'
import chalk from 'chalk'
import { IConfig } from '@oclif/config'

/**
 * Abstract base class for commands that need to use gates based on user's roles
 */
export abstract class RolesCommandBase extends AccountsCommandBase {
  group: WorkingGroups

  constructor(argv: string[], config: IConfig) {
    super(argv, config)
    // Can be modified by child class constructor
    this.group = this.getPreservedState().defaultWorkingGroup
  }

  // Use when lead access is required in given command
  async getRequiredLead(): Promise<GroupMember> {
    const selectedAccount: NamedKeyringPair = await this.getRequiredSelectedAccount()
    const lead = await this.getApi().groupLead(this.group)

    if (!lead || lead.roleAccount.toString() !== selectedAccount.address) {
      this.error(`${_.startCase(this.group)} Group Lead access required for this command!`, {
        exit: ExitCodes.AccessDenied,
      })
    }

    return lead
  }

  // Use when worker access is required in given command
  async getRequiredWorker(): Promise<GroupMember> {
    const selectedAccount: NamedKeyringPair = await this.getRequiredSelectedAccount()
    const groupMembers = await this.getApi().groupMembers(this.group)
    const groupMembersByAccount = groupMembers.filter((m) => m.roleAccount.toString() === selectedAccount.address)

    if (!groupMembersByAccount.length) {
      this.error(`${_.startCase(this.group)} Group Worker access required for this command!`, {
        exit: ExitCodes.AccessDenied,
      })
    } else if (groupMembersByAccount.length === 1) {
      return groupMembersByAccount[0]
    } else {
      return await this.promptForWorker(groupMembersByAccount)
    }
  }

  // Use when member controller access is required, but one of the associated roles is expected to be selected
  async getRequiredWorkerByMemberController(): Promise<GroupMember> {
    const selectedAccount: NamedKeyringPair = await this.getRequiredSelectedAccount()
    const memberIds = await this.getApi().getMemberIdsByControllerAccount(selectedAccount.address)
    const controlledWorkers = (await this.getApi().groupMembers(this.group)).filter((groupMember) =>
      memberIds.some((memberId) => groupMember.memberId.eq(memberId))
    )

    if (!controlledWorkers.length) {
      this.error(`Member controller account with some associated ${this.group} group roles needs to be selected!`, {
        exit: ExitCodes.AccessDenied,
      })
    } else if (controlledWorkers.length === 1) {
      return controlledWorkers[0]
    } else {
      return await this.promptForWorker(controlledWorkers)
    }
  }

  async promptForWorker(groupMembers: GroupMember[]): Promise<GroupMember> {
    const chosenWorkerIndex = await this.simplePrompt({
      message: `Choose the intended ${_.startCase(this.group)} Group Worker context:`,
      type: 'list',
      choices: groupMembers.map((groupMember, index) => ({
        name: `Worker ID ${groupMember.workerId.toString()}`,
        value: index,
      })),
    })

    return groupMembers[chosenWorkerIndex]
  }
}

/**
 * Abstract base class for commands directly related to working groups
 */
export default abstract class WorkingGroupsCommandBase extends RolesCommandBase {
  group: WorkingGroups

  constructor(argv: string[], config: IConfig) {
    super(argv, config)
    this.group = this.getPreservedState().defaultWorkingGroup
  }

  static flags = {
    group: flags.enum({
      char: 'g',
      description:
        'The working group context in which the command should be executed\n' +
        `Available values are: ${AvailableGroups.join(', ')}.`,
      required: false,
      options: [...AvailableGroups],
    }),
  }

  async promptForApplicationsToAccept(opening: GroupOpening): Promise<number[]> {
    const acceptableApplications = opening.applications.filter((a) => a.stage === ApplicationStageKeys.Active)
    const acceptedApplications = await this.simplePrompt({
      message: 'Select succesful applicants',
      type: 'checkbox',
      choices: acceptableApplications.map((a) => ({
        name: ` ${a.wgApplicationId}: ${a.member?.handle.toString()}`,
        value: a.wgApplicationId,
      })),
    })

    return acceptedApplications
  }

  async getOpening(id: number, requiredStatus?: OpeningStatus): Promise<GroupOpening> {
    const opening = await this.getApi().groupOpening(this.group, id)

    if (requiredStatus && opening.stage.status !== requiredStatus) {
      this.error(
        `The opening needs to be in "${_.startCase(requiredStatus)}" stage! ` +
          `This one is: "${_.startCase(opening.stage.status)}"`,
        { exit: ExitCodes.InvalidInput }
      )
    }

    return opening
  }

  async getOpeningForLeadAction(id: number, requiredStatus?: OpeningStatus): Promise<GroupOpening> {
    const opening = await this.getApi().groupOpening(this.group, id)

    if (!opening.type.isOfType('Worker')) {
      this.error('A lead can only manage Worker openings!', { exit: ExitCodes.AccessDenied })
    }

    if (requiredStatus && opening.stage.status !== requiredStatus) {
      this.error(
        `The opening needs to be in "${_.startCase(requiredStatus)}" stage! ` +
          `This one is: "${_.startCase(opening.stage.status)}"`,
        { exit: ExitCodes.InvalidInput }
      )
    }

    return opening
  }

  // An alias for better code readibility in case we don't need the actual return value
  validateOpeningForLeadAction = this.getOpeningForLeadAction

  async getApplicationForLeadAction(id: number, requiredStatus?: ApplicationStageKeys): Promise<GroupApplication> {
    const application = await this.getApi().groupApplication(this.group, id)
    const opening = await this.getApi().groupOpening(this.group, application.wgOpeningId)

    if (!opening.type.isOfType('Worker')) {
      this.error('A lead can only manage Worker opening applications!', { exit: ExitCodes.AccessDenied })
    }

    if (requiredStatus && application.stage !== requiredStatus) {
      this.error(
        `The application needs to have "${_.startCase(requiredStatus)}" status! ` +
          `This one has: "${_.startCase(application.stage)}"`,
        { exit: ExitCodes.InvalidInput }
      )
    }

    return application
  }

  async getWorkerForLeadAction(id: number, requireStakeProfile = false) {
    const groupMember = await this.getApi().groupMember(this.group, id)
    const groupLead = await this.getApi().groupLead(this.group)

    if (groupLead?.workerId.eq(groupMember.workerId)) {
      this.error('A lead cannot manage his own role this way!', { exit: ExitCodes.AccessDenied })
    }

    if (requireStakeProfile && !groupMember.stake) {
      this.error('This worker has no associated role stake profile!', { exit: ExitCodes.InvalidInput })
    }

    return groupMember
  }

  // Helper for better TS handling.
  // We could also use some magic with conditional types instead, but those don't seem be very well supported yet.
  async getWorkerWithStakeForLeadAction(id: number) {
    return (await this.getWorkerForLeadAction(id, true)) as GroupMember & Required<Pick<GroupMember, 'stake'>>
  }

  async init() {
    await super.init()
    const { flags } = this.parse(this.constructor as typeof WorkingGroupsCommandBase)
    if (flags.group) {
      this.group = flags.group
    }
    this.log(chalk.magentaBright('Current Group: ' + this.group))
  }
}
