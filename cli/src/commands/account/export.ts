import fs from 'fs'
import chalk from 'chalk'
import path from 'path'
import ExitCodes from '../../ExitCodes'
import AccountsCommandBase from '../../base/AccountsCommandBase'
import { flags } from '@oclif/command'
import { NamedKeyringPair } from '../../Types'

type AccountExportFlags = { all: boolean }
type AccountExportArgs = { path: string }

export default class AccountExport extends AccountsCommandBase {
  static description = 'Export account(s) to given location'
  static MULTI_EXPORT_FOLDER_NAME = 'exported_accounts'

  static args = [
    {
      name: 'path',
      required: true,
      description: 'Path where the exported files should be placed',
    },
  ]

  static flags = {
    all: flags.boolean({
      char: 'a',
      description: `If provided, exports all existing accounts into "${AccountExport.MULTI_EXPORT_FOLDER_NAME}" folder inside given path`,
    }),
  }

  exportAccount(account: NamedKeyringPair, destPath: string): string {
    const sourceFilePath: string = this.getAccountFilePath(account)
    const destFilePath: string = path.join(destPath, this.generateAccountFilename(account))
    try {
      fs.copyFileSync(sourceFilePath, destFilePath)
    } catch (e) {
      this.error(`Error while trying to copy into the export file: (${destFilePath}). Permissions issue?`, {
        exit: ExitCodes.FsOperationFailed,
      })
    }

    return destFilePath
  }

  async run() {
    const args: AccountExportArgs = this.parse(AccountExport).args as AccountExportArgs
    const flags: AccountExportFlags = this.parse(AccountExport).flags as AccountExportFlags
    const accounts: NamedKeyringPair[] = this.fetchAccounts()

    if (!accounts.length) {
      this.error('No accounts found!', { exit: ExitCodes.NoAccountFound })
    }

    if (flags.all) {
      const destPath: string = path.join(args.path, AccountExport.MULTI_EXPORT_FOLDER_NAME)
      try {
        if (!fs.existsSync(destPath)) fs.mkdirSync(destPath)
      } catch (e) {
        this.error(`Failed to create the export folder (${destPath})`, { exit: ExitCodes.FsOperationFailed })
      }
      for (const account of accounts) this.exportAccount(account, destPath)
      this.log(chalk.greenBright(`All accounts succesfully exported succesfully to: ${chalk.white(destPath)}!`))
    } else {
      const destPath: string = args.path
      const choosenAccount: NamedKeyringPair = await this.promptForAccount(
        accounts,
        null,
        'Select an account to export'
      )
      const exportedFilePath: string = this.exportAccount(choosenAccount, destPath)
      this.log(chalk.greenBright(`Account succesfully exported to: ${chalk.white(exportedFilePath)}`))
    }
  }
}
