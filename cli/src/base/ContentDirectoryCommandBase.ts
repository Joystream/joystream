import ExitCodes from '../ExitCodes'
import { WorkingGroups } from '../Types'
import { Channel, CuratorGroup, CuratorGroupId, ContentActor, Video } from '@joystream/types/content'
import { Worker } from '@joystream/types/working-group'
import { CLIError } from '@oclif/errors'
import { RolesCommandBase } from './WorkingGroupsCommandBase'
import { createType } from '@joystream/types'
import { flags } from '@oclif/command'

const CONTEXTS = ['Member', 'Curator', 'Lead'] as const
const OWNER_CONTEXTS = ['Member', 'Curator'] as const

type Context = typeof CONTEXTS[number]
type OwnerContext = typeof OWNER_CONTEXTS[number]

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
    name: 'context',
    required: false,
    description: `Actor context to execute the command in (${OWNER_CONTEXTS.join('/')})`,
    options: [...OWNER_CONTEXTS],
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

  // Use when lead access is required in given command
  async requireLead(): Promise<void> {
    await this.getRequiredLead()
  }

  async getCuratorContext(): Promise<ContentActor> {
    const curator = await this.getRequiredWorker()

    const groups = await this.getApi().availableCuratorGroups()
    const availableGroupIds = groups
      .filter(
        ([, group]) =>
          group.active.valueOf() && group.curators.toArray().some((curatorId) => curatorId.eq(curator.workerId))
      )
      .map(([id]) => id)

    let groupId: number
    if (!availableGroupIds.length) {
      this.error('You do not have the curator access!', { exit: ExitCodes.AccessDenied })
    } else if (availableGroupIds.length === 1) {
      groupId = availableGroupIds[0].toNumber()
    } else {
      groupId = await this.promptForCuratorGroup('Select Curator Group context', availableGroupIds)
    }

    return createType('ContentActor', { Curator: [groupId, curator.workerId.toNumber()] })
  }

  async promptForChannel(message = 'Select a channel'): Promise<Channel> {
    const channels = await this.getApi().availableChannels()
    const choices = channels.map(([id, c]) => ({ id: id.toString(), value: c }))
    if (!choices.length) {
      this.warn('No channels exist to choose from!')
      this.exit(ExitCodes.InvalidInput)
    }

    const selectedChannel = await this.simplePrompt({ message, type: 'list', choices })

    return selectedChannel
  }

  async promptForVideo(message = 'Select a video'): Promise<Video> {
    const videos = await this.getApi().availableVideos()
    const choices = videos.map(([id, c]) => ({ id: id.toString(), value: c }))
    if (!choices.length) {
      this.warn('No videos exist to choose from!')
      this.exit(ExitCodes.InvalidInput)
    }

    const selectedVideo = await this.simplePrompt({ message, type: 'list', choices })

    return selectedVideo
  }

  private async curatorGroupChoices(ids?: CuratorGroupId[]) {
    const groups = await this.getApi().availableCuratorGroups()
    return groups
      .filter(([id]) => (ids ? ids.some((allowedId) => allowedId.eq(id)) : true))
      .map(([id, group]) => ({
        name:
          `Group ${id.toString()} (` +
          `${group.active.valueOf() ? 'Active' : 'Inactive'}, ` +
          `${group.curators.toArray().length} member(s), `,
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

  async getActor(context: typeof CONTEXTS[number]) {
    let actor: ContentActor
    if (context === 'Member') {
      const memberId = await this.getRequiredMemberId()
      actor = this.createType('ContentActor', { Member: memberId })
    } else if (context === 'Curator') {
      actor = await this.getCuratorContext()
    } else {
      await this.getRequiredLead()

      actor = this.createType('ContentActor', { Lead: null })
    }

    return actor
  }
}
