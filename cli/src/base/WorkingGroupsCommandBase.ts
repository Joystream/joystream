import ExitCodes from '../ExitCodes'
import AccountsCommandBase from './AccountsCommandBase'
import { flags } from '@oclif/command'
import {
  WorkingGroups,
  AvailableGroups,
  NamedKeyringPair,
  GroupMember,
  GroupOpening,
  ApiMethodArg,
  ApiMethodNamedArgs,
  OpeningStatus,
  GroupApplication,
} from '../Types'
import { apiModuleByGroup } from '../Api'
import { CLIError } from '@oclif/errors'
import fs from 'fs'
import path from 'path'
import _ from 'lodash'
import { ApplicationStageKeys } from '@joystream/types/hiring'
import chalk from 'chalk'

const DEFAULT_GROUP = WorkingGroups.StorageProviders
const DRAFTS_FOLDER = 'opening-drafts'

/**
 * Abstract base class for commands related to working groups
 */
export default abstract class WorkingGroupsCommandBase extends AccountsCommandBase {
  group: WorkingGroups = DEFAULT_GROUP

  static flags = {
    group: flags.string({
      char: 'g',
      description:
        'The working group context in which the command should be executed\n' +
        `Available values are: ${AvailableGroups.join(', ')}.`,
      required: true,
      default: DEFAULT_GROUP,
    }),
  }

  // Use when lead access is required in given command
  async getRequiredLead(): Promise<GroupMember> {
    const selectedAccount: NamedKeyringPair = await this.getRequiredSelectedAccount()
    const lead = await this.getApi().groupLead(this.group)

    if (!lead || lead.roleAccount.toString() !== selectedAccount.address) {
      this.error('Lead access required for this command!', { exit: ExitCodes.AccessDenied })
    }

    return lead
  }

  // Use when worker access is required in given command
  async getRequiredWorker(): Promise<GroupMember> {
    const selectedAccount: NamedKeyringPair = await this.getRequiredSelectedAccount()
    const groupMembers = await this.getApi().groupMembers(this.group)
    const groupMembersByAccount = groupMembers.filter((m) => m.roleAccount.toString() === selectedAccount.address)

    if (!groupMembersByAccount.length) {
      this.error('Worker access required for this command!', { exit: ExitCodes.AccessDenied })
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
      message: 'Choose the intended worker context:',
      type: 'list',
      choices: groupMembers.map((groupMember, index) => ({
        name: `Worker ID ${groupMember.workerId.toString()}`,
        value: index,
      })),
    })

    return groupMembers[chosenWorkerIndex]
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

  async promptForNewOpeningDraftName() {
    let draftName = '',
      fileExists = false,
      overrideConfirmed = false

    do {
      draftName = await this.simplePrompt({
        type: 'input',
        message: 'Provide the draft name',
        validate: (val) => (typeof val === 'string' && val.length >= 1) || 'Draft name is required!',
      })

      fileExists = fs.existsSync(this.getOpeningDraftPath(draftName))
      if (fileExists) {
        overrideConfirmed = await this.simplePrompt({
          type: 'confirm',
          message: 'Such draft already exists. Do you wish to override it?',
          default: false,
        })
      }
    } while (fileExists && !overrideConfirmed)

    return draftName
  }

  async promptForOpeningDraft() {
    let draftFiles: string[] = []
    try {
      draftFiles = fs.readdirSync(this.getOpeingDraftsPath())
    } catch (e) {
      throw this.createDataReadError(DRAFTS_FOLDER)
    }
    if (!draftFiles.length) {
      throw new CLIError('No drafts available!', { exit: ExitCodes.FileNotFound })
    }
    const draftNames = draftFiles.map((fileName) => _.startCase(fileName.replace('.json', '')))
    const selectedDraftName = await this.simplePrompt({
      message: 'Select a draft',
      type: 'list',
      choices: draftNames,
    })

    return selectedDraftName
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

  loadOpeningDraftParams(draftName: string): ApiMethodNamedArgs {
    const draftFilePath = this.getOpeningDraftPath(draftName)
    const params = this.extrinsicArgsFromDraft(apiModuleByGroup[this.group], 'addOpening', draftFilePath)

    return params
  }

  getOpeingDraftsPath() {
    return path.join(this.getAppDataPath(), DRAFTS_FOLDER)
  }

  getOpeningDraftPath(draftName: string) {
    return path.join(this.getOpeingDraftsPath(), _.snakeCase(draftName) + '.json')
  }

  saveOpeningDraft(draftName: string, params: ApiMethodArg[]) {
    const paramsJson = JSON.stringify(
      params.map((p) => p.toJSON()),
      null,
      2
    )

    try {
      fs.writeFileSync(this.getOpeningDraftPath(draftName), paramsJson)
    } catch (e) {
      throw this.createDataWriteError(DRAFTS_FOLDER)
    }
  }

  private initOpeningDraftsDir(): void {
    if (!fs.existsSync(this.getOpeingDraftsPath())) {
      fs.mkdirSync(this.getOpeingDraftsPath())
    }
  }

  async init() {
    await super.init()
    try {
      this.initOpeningDraftsDir()
    } catch (e) {
      throw this.createDataDirInitError()
    }
    const { flags } = this.parse(this.constructor as typeof WorkingGroupsCommandBase)
    if (!AvailableGroups.includes(flags.group as any)) {
      throw new CLIError(`Invalid group! Available values are: ${AvailableGroups.join(', ')}`, {
        exit: ExitCodes.InvalidInput,
      })
    }
    this.group = flags.group as WorkingGroups

    this.log(chalk.white('Group: ' + flags.group))
  }
}
