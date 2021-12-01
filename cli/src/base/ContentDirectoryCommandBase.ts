import ExitCodes from '../ExitCodes'
import { WorkingGroups } from '../Types'
import { CuratorGroup, CuratorGroupId, ContentActor, Channel } from '@joystream/types/content'
import { Worker } from '@joystream/types/working-group'
import { CLIError } from '@oclif/errors'
import { RolesCommandBase } from './WorkingGroupsCommandBase'
import { createType, createTypeFromConstructor } from '@joystream/types'
import { flags } from '@oclif/command'

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
    await this.getRequiredLead()
  }

  async getCurationActorByChannel(channel: Channel): Promise<ContentActor> {
    return channel.owner.isOfType('Curators') ? await this.getActor('Lead') : await this.getActor('Curator')
  }

  async getChannelOwnerActor(channel: Channel): Promise<ContentActor> {
    if (channel.owner.isOfType('Curators')) {
      try {
        return await this.getActor('Lead')
      } catch (e) {
        return await this.getCuratorContext(channel.owner.asType('Curators'))
      }
    } else {
      const memberId = await this.getRequiredMemberId(false, [channel.owner.asType('Member')])
      return createType<ContentActor, 'ContentActor'>('ContentActor', { Member: memberId })
    }
  }

  async getChannelCollaborator(channel: Channel): Promise<ContentActor> {
    const memberId = await this.getRequiredMemberId(false, Array.from(channel.collaborators))
    return createType<ContentActor, 'ContentActor'>('ContentActor', { Collaborator: memberId })
  }

  async getChannelManagementActor(channel: Channel, context: ChannelManagementContext): Promise<ContentActor> {
    if (context && context === 'Owner') {
      return this.getChannelOwnerActor(channel)
    }
    if (context && context === 'Collaborator') {
      return this.getChannelCollaborator(channel)
    }

    // Context not set - derive
    try {
      const owner = await this.getChannelOwnerActor(channel)
      this.log('Derived context: Channel owner')
      return owner
    } catch (e) {
      const collaborator = await this.getChannelCollaborator(channel)
      this.log('Derived context: Channel collaborator')
      return collaborator
    }
  }

  async getCategoryManagementActor(): Promise<ContentActor> {
    try {
      return await this.getActor('Lead')
    } catch (e) {
      return await this.getActor('Curator')
    }
  }

  async getCuratorContext(requiredGroupId?: CuratorGroupId): Promise<ContentActor> {
    const curator = await this.getRequiredWorker()

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

    return createTypeFromConstructor(ContentActor, { Curator: [groupId, curator.workerId.toNumber()] })
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
        name: `${c.profile.handle.toString()} (Worker ID: ${c.workerId})`,
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

  async getActor(context: Exclude<keyof typeof ContentActor.typeDefinitions, 'Collaborator'>): Promise<ContentActor> {
    if (context === 'Member') {
      const memberId = await this.getRequiredMemberId()
      return this.createType('ContentActor', { Member: memberId })
    }

    if (context === 'Curator') {
      return this.getCuratorContext()
    }

    if (context === 'Lead') {
      await this.getRequiredLead()
      return this.createType('ContentActor', { Lead: null })
    }

    throw new Error(`Unrecognized context: ${context}`)
  }
}
