import ExitCodes from '../ExitCodes'
import { flags } from '@oclif/command'
import { AvailableGroups, GroupMember, OpeningDetails, ApplicationDetails } from '../Types'
import chalk from 'chalk'
import { memberHandle } from '../helpers/display'
import WorkingGroupCommandBase from './WorkingGroupCommandBase'

/**
 * Abstract base class for commands related to all working groups
 */
export default abstract class WorkingGroupsCommandBase extends WorkingGroupCommandBase {
  static flags = {
    group: flags.enum({
      char: 'g',
      description:
        'The working group context in which the command should be executed\n' +
        `Available values are: ${AvailableGroups.join(', ')}.`,
      required: false,
      options: [...AvailableGroups],
    }),
    ...WorkingGroupCommandBase.flags,
  }

  async promptForApplicationsToAccept(opening: OpeningDetails): Promise<number[]> {
    const acceptedApplications = await this.simplePrompt<number[]>({
      message: 'Select succesful applicants',
      type: 'checkbox',
      choices: opening.applications.map((a) => ({
        name: ` ${a.applicationId}: ${memberHandle(a.member)}`,
        value: a.applicationId,
      })),
    })

    return acceptedApplications
  }

  async getOpeningForLeadAction(id: number): Promise<OpeningDetails> {
    const opening = await this.getApi().groupOpening(this.group, id)

    if (!opening.type.isOfType('Regular')) {
      this.error('A lead can only manage Regular openings!', { exit: ExitCodes.AccessDenied })
    }

    return opening
  }

  // An alias for better code readibility in case we don't need the actual return value
  validateOpeningForLeadAction = this.getOpeningForLeadAction

  async getApplicationForLeadAction(id: number): Promise<ApplicationDetails> {
    const application = await this.getApi().groupApplication(this.group, id)
    const opening = await this.getApi().groupOpening(this.group, application.openingId)

    if (!opening.type.isOfType('Regular')) {
      this.error('A lead can only manage Regular opening applications!', { exit: ExitCodes.AccessDenied })
    }

    return application
  }

  async getWorkerForLeadAction(id: number, requireStakeProfile = false): Promise<GroupMember> {
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
  async getWorkerWithStakeForLeadAction(id: number): Promise<GroupMember & Required<Pick<GroupMember, 'stake'>>> {
    return (await this.getWorkerForLeadAction(id, true)) as GroupMember & Required<Pick<GroupMember, 'stake'>>
  }

  async init(): Promise<void> {
    await super.init()
    const { flags } = this.parse(this.constructor as typeof WorkingGroupsCommandBase)
    if (flags.group) {
      this._group = flags.group
    }
    this.log(chalk.magentaBright('Current Group: ' + this.group))
  }
}
