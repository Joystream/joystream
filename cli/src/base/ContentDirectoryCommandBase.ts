import ExitCodes from '../ExitCodes'
import AccountsCommandBase from './AccountsCommandBase'
import { WorkingGroups, NamedKeyringPair } from '../Types'
import { ReferenceProperty } from 'cd-schemas/types/extrinsics/AddClassSchema'
import { BOOL_PROMPT_OPTIONS } from '../helpers/JsonSchemaPrompt'
import { Class } from '@joystream/types/content-directory'

/**
 * Abstract base class for commands related to working groups
 */
export default abstract class ContentDirectoryCommandBase extends AccountsCommandBase {
  // Use when lead access is required in given command
  async requireLead(): Promise<void> {
    const selectedAccount: NamedKeyringPair = await this.getRequiredSelectedAccount()
    const lead = await this.getApi().groupLead(WorkingGroups.Curators)

    if (!lead || lead.roleAccount.toString() !== selectedAccount.address) {
      this.error('Content Working Group Lead access required for this command!', { exit: ExitCodes.AccessDenied })
    }
  }

  async promptForClass(message = 'Select a class'): Promise<Class> {
    const classes = await this.getApi().availableClasses()
    const choices = classes.map(([, c]) => ({ name: c.name.toString(), value: c }))

    const selectedClass = await this.simplePrompt({ message, type: 'list', choices })

    return selectedClass
  }

  async promptForCuratorGroups(message = 'Select a curator group'): Promise<number> {
    const groups = await this.getApi().availableGroups()
    const choices = groups.map(([id]) => ({
      name: `Group ${id.toString()}`,
      value: id.toNumber(),
    }))

    const selectedIds = await this.simplePrompt({ message, type: 'checkbox', choices })

    return selectedIds
  }

  async promptForClassReference(): Promise<ReferenceProperty['Reference']> {
    const selectedClass = await this.promptForClass()
    const sameOwner = await this.simplePrompt({ message: 'Same owner required?', ...BOOL_PROMPT_OPTIONS })
    return { className: selectedClass.name.toString(), sameOwner }
  }
}
