import ExitCodes from '../ExitCodes'
import { WorkingGroups } from '../Types'
import { CuratorGroup, CuratorGroupId, ContentActor, Channel } from '@joystream/types/content'
import { Worker } from '@joystream/types/working-group'
import { CLIError } from '@oclif/errors'
import { RolesCommandBase } from './WorkingGroupsCommandBase'
import { flags } from '@oclif/command'
import { memberHandle } from '../helpers/display'
import { MemberId } from '@joystream/types/common'
import { createType } from '@joystream/types'

const CHANNEL_CREATION_CONTEXTS = ['Member', 'Curator'] as const
const CATEGORIES_CONTEXTS = ['Lead', 'Curator'] as const
const CHANNEL_MANAGEMENT_CONTEXTS = ['Owner', 'Collaborator'] as const

type ChannelManagementContext = typeof CHANNEL_MANAGEMENT_CONTEXTS[number]
type ChannelCreationContext = typeof CHANNEL_CREATION_CONTEXTS[number]
type CategoriesContext = typeof CATEGORIES_CONTEXTS[number]

/**
 * Abstract base class for commands related to content directory
 */
export default abstract class ContentDirectoryCommandBase extends RolesCommandBase {
  static channelCreationContextFlag = flags.enum({
    required: false,
    description: `Actor context to execute the command in (${CHANNEL_CREATION_CONTEXTS.join('/')})`,
    options: [...CHANNEL_CREATION_CONTEXTS],
  })

  static channelManagementContextFlag = flags.enum({
    required: false,
    description: `Actor context to execute the command in (${CHANNEL_MANAGEMENT_CONTEXTS.join('/')})`,
    options: [...CHANNEL_MANAGEMENT_CONTEXTS],
  })

  static categoriesContextFlag = flags.enum({
    required: false,
    description: `Actor context to execute the command in (${CATEGORIES_CONTEXTS.join('/')})`,
    options: [...CATEGORIES_CONTEXTS],
  })

  async init(): Promise<void> {
    await super.init()
    this.group = WorkingGroups.Curators // override group for RolesCommandBase
  }

  async promptForChannelCreationContext(
    message = 'Choose in which context you wish to execute the command'
  ): Promise<ChannelCreationContext> {
    return this.simplePrompt({
      message,
      type: 'list',
      choices: CHANNEL_CREATION_CONTEXTS.map((c) => ({ name: c, value: c })),
    })
  }

  async promptForCategoriesContext(
    message = 'Choose in which context you wish to execute the command'
  ): Promise<CategoriesContext> {
    return this.simplePrompt({
      message,
      type: 'list',
      choices: CATEGORIES_CONTEXTS.map((c) => ({ name: c, value: c })),
    })
  }

  // Use when lead access is required in given command
  async requireLead(): Promise<void> {
    await this.getRequiredLeadContext()
  }

  getCurationActorByChannel(channel: Channel): Promise<[ContentActor, string]> {
    return channel.owner.isOfType('Curators') ? this.getContentActor('Lead') : this.getContentActor('Curator')
  }

  async getChannelOwnerActor(channel: Channel): Promise<[ContentActor, string]> {
    if (channel.owner.isOfType('Curators')) {
      try {
        return this.getContentActor('Lead')
      } catch (e) {
        return this.getCuratorContext(channel.owner.asType('Curators'))
      }
    } else {
      const { id, membership } = await this.getRequiredMemberContext(false, [channel.owner.asType('Member')])
      return [
        createType<ContentActor, 'ContentActor'>('ContentActor', { Member: id }),
        membership.controller_account.toString(),
      ]
    }
  }

  async getChannelCollaboratorActor(channel: Channel): Promise<[ContentActor, string]> {
    const { id, membership } = await this.getRequiredMemberContext(false, Array.from(channel.collaborators))
    return [
      createType<ContentActor, 'ContentActor'>('ContentActor', { Collaborator: id }),
      membership.controller_account.toString(),
    ]
  }

  async getChannelManagementActor(
    channel: Channel,
    context: ChannelManagementContext
  ): Promise<[ContentActor, string]> {
    if (context && context === 'Owner') {
      return this.getChannelOwnerActor(channel)
    }
    if (context && context === 'Collaborator') {
      return this.getChannelCollaboratorActor(channel)
    }

    // Context not set - derive

    try {
      const owner = await this.getChannelOwnerActor(channel)
      this.log('Derived context: Channel owner')
      return owner
    } catch (e) {
      // continue
    }

    try {
      const collaborator = await this.getChannelCollaboratorActor(channel)
      this.log('Derived context: Channel collaborator')
      return collaborator
    } catch (e) {
      // continue
    }

    this.error('No account found with access to manage the provided channel', { exit: ExitCodes.AccessDenied })
  }

  async getCategoryManagementActor(): Promise<[ContentActor, string]> {
    try {
      const lead = await this.getContentActor('Lead')
      this.log('Derived context: Lead')
      return lead
    } catch (e) {
      // continue
    }
    try {
      const curator = await this.getContentActor('Curator')
      this.log('Derived context: Curator')
      return curator
    } catch (e) {
      // continue
    }

    this.error('Lead / Curator Group member permissions are required for this action', { exit: ExitCodes.AccessDenied })
  }

  async getCuratorContext(requiredGroupId?: CuratorGroupId): Promise<[ContentActor, string]> {
    const curator = await this.getRequiredWorkerContext()

    let groupId: number
    if (requiredGroupId) {
      const group = await this.getCuratorGroup(requiredGroupId.toNumber())
      if (!group.active.valueOf()) {
        this.error(`Curator group ${requiredGroupId.toString()} is no longer active`, { exit: ExitCodes.AccessDenied })
      }
      if (!Array.from(group.curators).some((curatorId) => curatorId.eq(curator.workerId))) {
        this.error(`You don't belong to required curator group (ID: ${requiredGroupId.toString()})`, {
          exit: ExitCodes.AccessDenied,
        })
      }
      groupId = requiredGroupId.toNumber()
    } else {
      const groups = await this.getApi().availableCuratorGroups()
      const availableGroupIds = groups
        .filter(
          ([, group]) =>
            group.active.valueOf() && Array.from(group.curators).some((curatorId) => curatorId.eq(curator.workerId))
        )
        .map(([id]) => id)

      if (!availableGroupIds.length) {
        this.error("You don't belong to any active curator group!", { exit: ExitCodes.AccessDenied })
      } else if (availableGroupIds.length === 1) {
        groupId = availableGroupIds[0].toNumber()
      } else {
        groupId = await this.promptForCuratorGroup('Select Curator Group context', availableGroupIds)
      }
    }

    return [
      createType<ContentActor, 'ContentActor'>('ContentActor', { Curator: [groupId, curator.workerId.toNumber()] }),
      curator.roleAccount.toString(),
    ]
  }

  private async curatorGroupChoices(ids?: CuratorGroupId[]) {
    const groups = await this.getApi().availableCuratorGroups()
    return groups
      .filter(([id]) => (ids ? ids.some((allowedId) => allowedId.eq(id)) : true))
      .map(([id, group]) => ({
        name:
          `Group ${id.toString()} (` +
          `${group.active.valueOf() ? 'Active' : 'Inactive'}, ` +
          `${Array.from(group.curators).length} member(s)), `,
        value: id.toNumber(),
      }))
  }

  async promptForCuratorGroup(message = 'Select a Curator Group', ids?: CuratorGroupId[]): Promise<number> {
    const choices = await this.curatorGroupChoices(ids)
    if (!choices.length) {
      this.warn('No Curator Groups to choose from!')
      this.exit(ExitCodes.InvalidInput)
    }
    const selectedId = await this.simplePrompt({ message, type: 'list', choices })

    return selectedId
  }

  async promptForCuratorGroups(message = 'Select Curator Groups'): Promise<number[]> {
    const choices = await this.curatorGroupChoices()
    if (!choices.length) {
      return []
    }
    const selectedIds = await this.simplePrompt({ message, type: 'checkbox', choices })

    return selectedIds
  }

  async promptForCurator(message = 'Choose a Curator', ids?: number[]): Promise<number> {
    const curators = await this.getApi().groupMembers(WorkingGroups.Curators)
    const choices = curators
      .filter((c) => (ids ? ids.includes(c.workerId.toNumber()) : true))
      .map((c) => ({
        name: `${memberHandle(c.profile)} (Worker ID: ${c.workerId})`,
        value: c.workerId.toNumber(),
      }))

    if (!choices.length) {
      this.warn('No Curators to choose from!')
      this.exit(ExitCodes.InvalidInput)
    }

    const selectedCuratorId = await this.simplePrompt({
      message,
      type: 'list',
      choices,
    })

    return selectedCuratorId
  }

  async getCurator(id: string | number): Promise<Worker> {
    if (typeof id === 'string') {
      id = parseInt(id)
    }

    let curator
    try {
      curator = await this.getApi().workerByWorkerId(WorkingGroups.Curators, id)
    } catch (e) {
      if (e instanceof CLIError) {
        throw new CLIError('Invalid Curator id!')
      }
      throw e
    }

    return curator
  }

  async getCuratorGroup(id: string | number): Promise<CuratorGroup> {
    if (typeof id === 'string') {
      id = parseInt(id)
    }

    const group = await this.getApi().curatorGroupById(id)

    if (!group) {
      this.error('Invalid Curator Group id!', { exit: ExitCodes.InvalidInput })
    }

    return group
  }

  async getContentActor(
    context: Exclude<keyof typeof ContentActor.typeDefinitions, 'Collaborator'>
  ): Promise<[ContentActor, string]> {
    if (context === 'Member') {
      const { id, membership } = await this.getRequiredMemberContext()
      return [
        createType<ContentActor, 'ContentActor'>('ContentActor', { Member: id }),
        membership.controller_account.toString(),
      ]
    }

    if (context === 'Curator') {
      return this.getCuratorContext()
    }

    if (context === 'Lead') {
      const lead = await this.getRequiredLeadContext()
      return [createType<ContentActor, 'ContentActor'>('ContentActor', { Lead: null }), lead.roleAccount.toString()]
    }

    throw new Error(`Unrecognized context: ${context}`)
  }

  async validateCollaborators(collaborators: number[] | MemberId[]): Promise<void> {
    const collaboratorMembers = await this.getApi().getMembers(collaborators)
    if (collaboratorMembers.length < collaborators.length || collaboratorMembers.some((m) => m.isEmpty)) {
      this.error(`Invalid collaborator set! All collaborators must be existing members.`, {
        exit: ExitCodes.InvalidInput,
      })
    }
  }
}
