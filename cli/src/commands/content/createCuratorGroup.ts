import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import chalk from 'chalk'

export default class CreateCuratorGroupCommand extends ContentDirectoryCommandBase {
  static description = 'Create new Curator Group.'
  static aliases = ['createCuratorGroup']

  async run() {
    const account = await this.getRequiredSelectedAccount()
    await this.requireLead()

    await this.requestAccountDecoding(account)
    await this.buildAndSendExtrinsic(account, 'content', 'createCuratorGroup')

    const newGroupId = (await this.getApi().nextCuratorGroupId()) - 1
    console.log(chalk.green(`New group succesfully created! (ID: ${chalk.white(newGroupId)})`))
  }
}
