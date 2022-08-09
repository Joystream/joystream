import ExitCodes from '../ExitCodes'
import { WorkingGroups } from '../Types'
import {
  PalletContentChannelActionPermission as ChannelActionPermission,
  PalletContentPermissionsCuratorGroupContentModerationAction as ContentModerationAction,
  PalletContentPermissionsCuratorGroup as CuratorGroup,
  PalletWorkingGroupGroupWorker as Worker,
  PalletContentPermissionsContentActor as ContentActor,
  PalletContentChannelRecord as Channel,
  PalletContentChannelOwner as ChannelOwner,
} from '@polkadot/types/lookup'

import { CLIError } from '@oclif/errors'
import { flags } from '@oclif/command'
import { memberHandle } from '../helpers/display'
import { MemberId, CuratorGroupId, ChannelPrivilegeLevel } from '@joystream/types/primitives'
import { CreateInterface, createType } from '@joystream/types'
import WorkingGroupCommandBase from './WorkingGroupCommandBase'
import BN from 'bn.js'

const CHANNEL_CREATION_CONTEXTS = ['Member', 'CuratorGroup'] as const
const CATEGORIES_CONTEXTS = ['Lead', 'Curator'] as const
const MODERATION_ACTION_CONTEXTS = ['Lead', 'Curator'] as const
const CHANNEL_MANAGEMENT_CONTEXTS = ['Owner', 'Curator', 'Collaborator'] as const

type ChannelManagementContext = typeof CHANNEL_MANAGEMENT_CONTEXTS[number]
type ChannelCreationContext = typeof CHANNEL_CREATION_CONTEXTS[number]
type CategoriesContext = typeof CATEGORIES_CONTEXTS[number]
type ModerationActionContext = typeof MODERATION_ACTION_CONTEXTS[number]

/**
 * Abstract base class for commands related to content directory
 */
export default abstract class ContentDirectoryCommandBase extends WorkingGroupCommandBase {
  static flags = {
    ...WorkingGroupCommandBase.flags,
  }

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

  static moderationActionContextFlag = flags.enum({
    required: false,
    description: `Actor context to execute the command in (${MODERATION_ACTION_CONTEXTS.join('/')})`,
    options: [...MODERATION_ACTION_CONTEXTS],
  })

  static categoriesContextFlag = flags.enum({
    required: false,
    description: `Actor context to execute the command in (${CATEGORIES_CONTEXTS.join('/')})`,
    options: [...CATEGORIES_CONTEXTS],
  })

  async init(): Promise<void> {
    await super.init()
    this._group = WorkingGroups.Curators // override group for RolesCommandBase
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
    return channel.owner.isCuratorGroup ? this.getContentActor('Lead') : this.getContentActor('Curator')
  }

  async getChannelOwnerActor(channel: Channel): Promise<[ContentActor, string]> {
    if (channel.owner.isCuratorGroup) {
      return this.getContentActor('Lead')
    }
    const { id, membership } = await this.getRequiredMemberContext(false, [channel.owner.asMember])
    return [createType('PalletContentPermissionsContentActor', { Member: id }), membership.controllerAccount.toString()]
  }

  async getChannelCollaboratorActor(channel: Channel): Promise<[ContentActor, string]> {
    const { id, membership } = await this.getRequiredMemberContext(false, Array.from(channel.collaborators.keys()))
    return [createType('PalletContentPermissionsContentActor', { Member: id }), membership.controllerAccount.toString()]
  }

  isChannelOwner(channel: Channel, actor: ContentActor): boolean {
    return channel.owner.isCuratorGroup
      ? (actor.isCurator && actor.asCurator[0].eq(channel.owner.asCuratorGroup)) || actor.isLead
      : actor.isMember && actor.asMember.eq(channel.owner.asMember)
  }

  async hasRequiredChannelAgentPermissions(
    actor: ContentActor,
    channel: Channel,
    requiredPermissions: ChannelActionPermission['type'][]
  ): Promise<boolean> {
    // CASE: CuratorGroup owned channel
    if (channel.owner.isCuratorGroup) {
      // Lead context
      if (actor.isLead) {
        return true
      }
      // Curator context
      if (actor.isCurator && actor.asCurator[0].eq(channel.owner.asCuratorGroup)) {
        const { curators } = await this.getCuratorGroup(actor.asCurator[0].toNumber())
        const curatorChannelAgentPermissions = [...curators].find(([k]) => k.eq(actor.asCurator[1]))?.[1]
        return !!(
          curatorChannelAgentPermissions &&
          requiredPermissions.every((requiredPermission) =>
            [...curatorChannelAgentPermissions].find((p) => p[`is${requiredPermission}`])
          )
        )
      }
      // Collaborator context
      const collaboratorChannelAgentPermissions = [...channel.collaborators].find(([k]) => k.eq(actor.asMember))?.[1]
      return !!(
        collaboratorChannelAgentPermissions &&
        requiredPermissions.every((requiredPermission) =>
          [...collaboratorChannelAgentPermissions].find((p) => p[`is${requiredPermission}`])
        )
      )
    }

    // CASE: Member owned channel
    if (channel.owner.isMember) {
      // Owner context
      if (actor.isMember && actor.asMember.eq(channel.owner.asMember)) {
        return true
      }
      // Collaborator context
      const collaboratorChannelAgentPermissions = [...channel.collaborators].find(([k]) => k.eq(actor.asMember))?.[1]
      return !!(
        collaboratorChannelAgentPermissions &&
        requiredPermissions.every((requiredPermission) =>
          [...collaboratorChannelAgentPermissions].find((p) => p[`is${requiredPermission}`])
        )
      )
    }

    return false
  }

  async isModeratorWithRequiredPermission(
    actor: ContentActor,
    channelPrivilegeLevel: ChannelPrivilegeLevel,
    permission: CreateInterface<ContentModerationAction>
  ): Promise<boolean> {
    if (actor.isLead) {
      return true
    }

    const permissionRequired = createType('PalletContentPermissionsCuratorGroupContentModerationAction', permission)
    const { permissionsByLevel } = await this.getCuratorGroup(actor.asCurator[0].toNumber())
    const permissionsForLevel = [...permissionsByLevel].find(([k]) => k.eq(channelPrivilegeLevel))?.[1]
    return !!(
      permissionsForLevel &&
      [...permissionsForLevel].find((p) => p.type === permissionRequired.type && p.value.eq(permissionRequired.value))
    )
  }

  async getChannelManagementActor(
    channel: Channel,
    context: ChannelManagementContext
  ): Promise<[ContentActor, string]> {
    if (context && context === 'Owner') {
      return this.getChannelOwnerActor(channel)
    }
    if (context && context === 'Curator' && channel.owner.isCuratorGroup) {
      return this.getCuratorContext(channel.owner.asCuratorGroup)
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
      if (channel.owner.isCuratorGroup) {
        const curator = await this.getCuratorContext(channel.owner.asCuratorGroup)
        this.log('Derived context: Curator')
        return curator
      }
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

  async getModerationActionActor(context: ModerationActionContext): Promise<[ContentActor, string]> {
    if (context && context === 'Lead') {
      const lead = await this.getRequiredLeadContext()
      return [createType('PalletContentPermissionsContentActor', { Lead: null }), lead.roleAccount.toString()]
    }
    if (context && context === 'Curator') {
      return this.getCuratorContext()
    }

    // Context not set - derive

    try {
      const lead = await this.getRequiredLeadContext()
      this.log('Derived context: Lead')
      return [createType('PalletContentPermissionsContentActor', { Lead: null }), lead.roleAccount.toString()]
    } catch (e) {
      // continue
    }

    try {
      const curator = await this.getCuratorContext()
      this.log('Derived context: Curator')
      return curator
    } catch (e) {
      // continue
    }

    this.error('No account found with access to perform given moderation action', { exit: ExitCodes.AccessDenied })
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
      if (!Array.from(group.curators).some(([curatorId]) => curatorId.eq(curator.workerId))) {
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
            group.active.valueOf() && Array.from(group.curators).some(([curatorId]) => curatorId.eq(curator.workerId))
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
      createType('PalletContentPermissionsContentActor', { Curator: [groupId, curator.workerId.toNumber()] }),
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
    const selectedId = await this.simplePrompt<number>({ message, type: 'list', choices })

    return selectedId
  }

  async promptForCuratorGroups(message = 'Select Curator Groups'): Promise<number[]> {
    const choices = await this.curatorGroupChoices()
    if (!choices.length) {
      return []
    }
    const selectedIds = await this.simplePrompt<number[]>({ message, type: 'checkbox', choices })

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

    const selectedCuratorId = await this.simplePrompt<number>({
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

  async getChannelOwner(context: ChannelOwner['type']): Promise<[ChannelOwner, string]> {
    if (context === 'Member') {
      const { id, membership } = await this.getRequiredMemberContext()

      return [createType('PalletContentChannelOwner', { Member: id }), membership.controllerAccount.toString()]
    }

    if (context === 'CuratorGroup') {
      const lead = await this.getRequiredLeadContext()
      const curatorGroupId = await this.promptForCuratorGroup()

      return [createType('PalletContentChannelOwner', { CuratorGroup: curatorGroupId }), lead.roleAccount.toString()]
    }

    throw new Error(`Unrecognized context: ${context}`)
  }

  async getContentActor(context: ContentActor['type']): Promise<[ContentActor, string]> {
    if (context === 'Member') {
      const { id, membership } = await this.getRequiredMemberContext()
      return [
        createType('PalletContentPermissionsContentActor', { Member: id }),
        membership.controllerAccount.toString(),
      ]
    }

    if (context === 'Curator') {
      return this.getCuratorContext()
    }

    if (context === 'Lead') {
      const lead = await this.getRequiredLeadContext()
      return [createType('PalletContentPermissionsContentActor', { Lead: null }), lead.roleAccount.toString()]
    }

    throw new Error(`Unrecognized context: ${context}`)
  }

  async validateMemberIdsSet(ids: number[] | MemberId[], setName: 'collaborator' | 'moderator'): Promise<void> {
    const members = await this.getApi().getMembers(ids)
    if (members.length < ids.length || members.some((m) => m.isEmpty)) {
      this.error(`Invalid ${setName} set! All ${setName} set members must be existing members!`, {
        exit: ExitCodes.InvalidInput,
      })
    }
  }

  async getDataObjectsInfoFromQueryNode(channelId: number): Promise<[string, BN][]> {
    const dataObjects = await this.getQNApi().dataObjectsByBagId(`dynamic:channel:${channelId}`)

    if (dataObjects.length) {
      this.log('Following data objects are still associated with the channel:')
      dataObjects.forEach((o) => {
        let parentStr = ''
        if ('video' in o.type && o.type.video) {
          parentStr = ` (video: ${o.type.video.id})`
        }
        this.log(`- ${o.id} - ${o.type.__typename}${parentStr}`)
      })
    }

    return dataObjects.map((o) => [o.id, new BN(o.stateBloatBond)])
  }

  async getDataObjectsInfoFromChain(channelId: number): Promise<[string, BN][]> {
    const dataObjects = await this.getApi().dataObjectsInBag(
      createType('PalletStorageBagIdType', { Dynamic: { Channel: channelId } })
    )

    if (dataObjects.length) {
      const dataObjectIds = dataObjects.map(([id]) => id.toString())
      this.log(`Following data objects are still associated with the channel: ${dataObjectIds.join(', ')}`)
    }

    return dataObjects.map(([id, o]) => [id.toString(), o.stateBloatBond])
  }

  async getVideosInfoFromQueryNode(channelId: number): Promise<[string, BN][]> {
    const channel = await this.getQNApi().getChannelById(channelId.toString())
    if (!channel) {
      this.error('Could not fetch the channel info from the query node', { exit: ExitCodes.QueryNodeError })
    }

    return channel.videos.map(({ id, videoStateBloatBond }) => [id, videoStateBloatBond])
  }
}
