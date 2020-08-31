import fs from 'fs'
import chalk from 'chalk'
import path from 'path'
import ExitCodes from '../../ExitCodes'
import AccountsCommandBase from '../../base/AccountsCommandBase'
import { NamedKeyringPair } from '../../Types'

type AccountImportArgs = {
  backupFilePath: string
}

export default class AccountImport extends AccountsCommandBase {
  static description = 'Import account using JSON backup file'

  static args = [
    {
      name: 'backupFilePath',
      required: true,
      description: 'Path to account backup JSON file',
    },
  ]

  async run() {
    const args: AccountImportArgs = this.parse(AccountImport).args as AccountImportArgs
    const backupAcc: NamedKeyringPair = this.fetchAccountFromJsonFile(args.backupFilePath)
    const accountName: string = backupAcc.meta.name
    const accountAddress: string = backupAcc.address

    const sourcePath: string = args.backupFilePath
    const destPath: string = path.join(this.getAccountsDirPath(), this.generateAccountFilename(backupAcc))

    try {
      fs.copyFileSync(sourcePath, destPath)
    } catch (e) {
      this.error('Unexpected error while trying to copy input file! Permissions issue?', {
        exit: ExitCodes.FsOperationFailed,
      })
    }

    this.log(chalk.bold.greenBright(`ACCOUNT IMPORTED SUCCESFULLY!`))
    this.log(chalk.bold.white(`NAME:    `), accountName)
    this.log(chalk.bold.white(`ADDRESS: `), accountAddress)
  }
}
