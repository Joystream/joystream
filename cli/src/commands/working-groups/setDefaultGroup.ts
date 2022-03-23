import WorkingGroupsCommandBase from '../../base/WorkingGroupsCommandBase'
import chalk from 'chalk'
import ExitCodes from '../../ExitCodes'

export default class SetDefaultGroupCommand extends WorkingGroupsCommandBase {
  static description = 'Change the default group context for working-groups commands.'
  static flags = { ...WorkingGroupsCommandBase.flags }

  async run(): Promise<void> {
    const {
      flags: { group },
    } = this.parse(SetDefaultGroupCommand)

    if (!group) {
      this.error('--group flag is required', { exit: ExitCodes.InvalidInput })
    }

    await this.setPreservedState({ defaultWorkingGroup: group })

    this.log(chalk.green(`${chalk.magentaBright(group)} successfully set as default working group context`))
  }
}
