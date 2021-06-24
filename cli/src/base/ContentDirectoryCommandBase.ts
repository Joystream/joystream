import ExitCodes from '../ExitCodes'
import { WorkingGroups } from '../Types'
import { CuratorGroup, CuratorGroupId, ContentActor, Channel } from '@joystream/types/content'
import { Worker } from '@joystream/types/working-group'
import { CLIError } from '@oclif/errors'
import { RolesCommandBase } from './WorkingGroupsCommandBase'
import { createType } from '@joystream/types'
import { flags } from '@oclif/command'
import { memberHandle } from '../helpers/display'

const CONTEXTS = ['Member', 'Curator', 'Lead'] as const
const OWNER_CONTEXTS = ['Member', 'Curator'] as const
const CATEGORIES_CONTEXTS = ['Lead', 'Curator'] as const

type Context = typeof CONTEXTS[number]
type OwnerContext = typeof OWNER_CONTEXTS[number]
type CategoriesContext = typeof CATEGORIES_CONTEXTS[number]

/**
 * Abstract base class for commands related to content directory
 */
export default abstract class ContentDirectoryCommandBase extends RolesCommandBase {
  group = WorkingGroups.Curators // override group for RolesCommandBase

  static contextFlag = flags.enum({
    name: 'context',
    required: false,
    description: `Actor context to execute the command in (${CONTEXTS.join('/')})`,
    options: [...CONTEXTS],
  })

  static ownerContextFlag = flags.enum({
    name: 'ownerContext',
    required: false,
    description: `Actor context to execute the command in (${OWNER_CONTEXTS.join('/')})`,
    options: [...OWNER_CONTEXTS],
  })

  static categoriesContextFlag = flags.enum({
    name: 'categoriesContext',
    required: false,
    description: `Actor context to execute the command in (${CATEGORIES_CONTEXTS.join('/')})`,
    options: [...CATEGORIES_CONTEXTS],
  })

  async promptForContext(message = 'Choose in which context you wish to execute the command'): Promise<Context> {
    return this.simplePrompt({
      message,
      type: 'list',
      choices: CONTEXTS.map((c) => ({ name: c, value: c })),
    })
  }

  async promptForOwnerContext(
    message = 'Choose in which context you wish to execute the command'
  ): Promise<OwnerContext> {
    return this.simplePrompt({
      message,
      type: 'list',
      choices: OWNER_CONTEXTS.map((c) => ({ name: c, value: c })),
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
      return await this.getActor('Member')
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
    const curator = await this.getRequiredWorkerContext()

    let groupId: number
    if (requiredGroupId) {
      const group = await this.getCuratorGroup(requiredGroupId.toNumber())
      if (!group.active.valueOf()) {
        this.error(`Curator group ${requiredGroupId.toString()} is no longer active`, { exit: ExitCodes.AccessDenied })
      }
      if (!group.curators.toArray().some((curatorId) => curatorId.eq(curator.workerId))) {
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
            group.active.valueOf() && group.curators.toArray().some((curatorId) => curatorId.eq(curator.workerId))
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

    return createType('ContentActor', { Curator: [groupId, curator.workerId.toNumber()] })
  }

  private async curatorGroupChoices(ids?: CuratorGroupId[]) {
    const groups = await this.getApi().availableCuratorGroups()
    return groups
      .filter(([id]) => (ids ? ids.some((allowedId) => allowedId.eq(id)) : true))
      .map(([id, group]) => ({
        name:
          `Group ${id.toString()} (` +
          `${group.active.valueOf() ? 'Active' : 'Inactive'}, ` +
          `${group.curators.toArray().length} member(s)), `,
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

  async getActor(context: typeof CONTEXTS[number]) {
    let actor: ContentActor
    if (context === 'Member') {
      const { id } = await this.getRequiredMemberContext()
      actor = this.createType('ContentActor', { Member: id })
    } else if (context === 'Curator') {
      actor = await this.getCuratorContext()
    } else {
      await this.getRequiredLeadContext()

      actor = this.createType('ContentActor', { Lead: null })
    }

    return actor
  }
}
