import { MemberId } from '@joystream/types/primitives'
import { flags } from '@oclif/command'
import { AccountId } from '@polkadot/types/interfaces'
import { formatBalance } from '@polkadot/util'
import { validateAddress } from '@polkadot/util-crypto'
import chalk from 'chalk'
import ExitCodes from '../ExitCodes'
import { MemberDetails } from '../Types'
import { memberHandle } from '../helpers/display'
import AccountsCommandBase from './AccountsCommandBase'

/**
 * Abstract base class for membership-related commands / commands that require membership context.
 */
export default abstract class MembershipsCommandBase extends AccountsCommandBase {
  private selectedMember: MemberDetails | undefined

  static flags = {
    useMemberId: flags.integer({
      required: false,
      description: 'Try using the specified member id as context whenever possible',
    }),
  }

  async getRequiredMemberContext(
    useSelected = false,
    allowedIds?: MemberId[],
    accountType: 'controller' | 'root' = 'controller'
  ): Promise<MemberDetails> {
    const flags = this.parse(this.constructor as typeof MembershipsCommandBase).flags

    if (
      useSelected &&
      this.selectedMember &&
      (!allowedIds || allowedIds.some((id) => id.eq(this.selectedMember?.id)))
    ) {
      return this.selectedMember
    }

    if (
      flags.useMemberId !== undefined &&
      (!allowedIds || allowedIds.some((id) => id.toNumber() === flags.useMemberId))
    ) {
      this.selectedMember = await this.getApi().expectedMemberDetailsById(flags.useMemberId)
      return this.selectedMember
    }

    const membersDetails = allowedIds
      ? await this.getApi().membersDetailsByIds(allowedIds)
      : await this.getApi().allMembersDetails()

    const availableMemberships = await Promise.all(
      membersDetails.filter((m) =>
        this.isKeyAvailable(
          accountType === 'controller' ? m.membership.controllerAccount.toString() : m.membership.rootAccount.toString()
        )
      )
    )

    if (!availableMemberships.length) {
      this.error(
        `No ${allowedIds ? 'allowed ' : ''}member ${accountType} key available!` +
          (allowedIds ? ` Allowed members: ${allowedIds.join(', ')}.` : ''),
        {
          exit: ExitCodes.AccessDenied,
        }
      )
    } else if (availableMemberships.length === 1) {
      this.selectedMember = availableMemberships[0]
    } else {
      this.selectedMember = await this.promptForMember(availableMemberships, 'Choose member context')
    }

    return this.selectedMember
  }

  async promptForMember(availableMemberships: MemberDetails[], message = 'Choose a member'): Promise<MemberDetails> {
    const memberIndex = await this.simplePrompt<number>({
      type: 'list',
      message,
      choices: availableMemberships.map((m, i) => ({
        name: `id: ${m.id}, handle: ${memberHandle(m)}`,
        value: i,
      })),
    })

    return availableMemberships[memberIndex]
  }

  async getValidatedMemberRemarkParams(payment?: {
    amount: string
    account?: string
  }): Promise<[MemberId, AccountId, [string, string] | null]> {
    const {
      id,
      membership: { controllerAccount },
    } = await this.getRequiredMemberContext(true)

    if (payment) {
      let { account, amount } = payment
      if (!account) {
        account = await this.promptForAnyAddress(`Select recipient for 'member_remark' transfer`)
      } else if (validateAddress(account) !== true) {
        this.error('Invalid recipient address', { exit: ExitCodes.InvalidInput })
      }

      await this.ensureJoyTransferIsPossible(controllerAccount.toString(), account, amount)

      await this.requireConfirmation(
        `Do you confirm transfer of ${chalk.cyan(formatBalance(amount))} to ${chalk.cyan(account)}?`
      )
      return [id, controllerAccount, [account, amount]]
    }

    return [id, controllerAccount, null]
  }
}
