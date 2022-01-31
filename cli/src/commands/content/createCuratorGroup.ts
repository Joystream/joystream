import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import chalk from 'chalk'

export default class CreateCuratorGroupCommand extends ContentDirectoryCommandBase {
  static description = 'Create new Curator Group.'
  static aliases = ['createCuratorGroup']

  async run(): Promise<void> {
    const lead = await this.getRequiredLeadContext()

    await this.buildAndSendExtrinsic(await this.getDecodedPair(lead.roleAccount), 'content', 'createCuratorGroup')

    // TODO: Get id from event?
    console.log(chalk.green(`New group successfully created!`))
  }
}
