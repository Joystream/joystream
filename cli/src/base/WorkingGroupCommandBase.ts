import ExitCodes from '../ExitCodes'
import { flags } from '@oclif/command'
import { WorkingGroups, GroupMember } from '../Types'
import _ from 'lodash'
import MembershipsCommandBase from './MembershipsCommandBase'

/**
 * Abstract base class for commands relying on a specific working group context
 */
export default abstract class WorkingGroupCommandBase extends MembershipsCommandBase {
  _group: WorkingGroups | undefined

  protected get group(): WorkingGroups {
    if (!this._group) {
      this.error('Trying to access WorkingGroup before initialization', {
        exit: ExitCodes.UnexpectedException,
      })
    }
    return this._group
  }

  static flags = {
    useWorkerId: flags.integer({
      required: false,
      description: 'Try using the specified worker id as context whenever possible',
    }),
    ...MembershipsCommandBase.flags,
  }

  async init(): Promise<void> {
    await super.init()
    this._group = this.getPreservedState().defaultWorkingGroup
  }

  // Use when lead access is required in given command
  async getRequiredLeadContext(): Promise<GroupMember> {
    const lead = await this.getApi().groupLead(this.group)

    if (!lead || !this.isKeyAvailable(lead.roleAccount)) {
      this.error(`${_.startCase(this.group)} Group Lead access required for this command!`, {
        exit: ExitCodes.AccessDenied,
      })
    }

    return lead
  }

  // Use when worker access is required in given command
  async getRequiredWorkerContext(expectedKeyType: 'Role' | 'MemberController' = 'Role'): Promise<GroupMember> {
    const flags = this.parse(this.constructor as typeof WorkingGroupCommandBase).flags

    const groupMembers = await this.getApi().groupMembers(this.group)
    const availableGroupMemberContexts = groupMembers.filter((m) =>
      expectedKeyType === 'Role'
        ? this.isKeyAvailable(m.roleAccount.toString())
        : this.isKeyAvailable(m.profile.membership.controller_account.toString())
    )

    if (!availableGroupMemberContexts.length) {
      this.error(`No ${_.startCase(this.group)} Group Worker ${_.startCase(expectedKeyType)} key available!`, {
        exit: ExitCodes.AccessDenied,
      })
    } else if (availableGroupMemberContexts.length === 1) {
      return availableGroupMemberContexts[0]
    } else {
      const matchingContext =
        flags.useWorkerId !== undefined &&
        (availableGroupMemberContexts.find((c) => c.workerId.toNumber() === flags.useWorkerId) ||
          availableGroupMemberContexts.find((c) => c.memberId.toNumber() === flags.useMemberId))
      if (matchingContext) {
        return matchingContext
      }
      return await this.promptForWorker(availableGroupMemberContexts)
    }
  }

  async promptForWorker(groupMembers: GroupMember[]): Promise<GroupMember> {
    const chosenWorkerIndex = await this.simplePrompt<number>({
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
