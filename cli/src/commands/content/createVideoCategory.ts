import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import { metadataToString } from '../../helpers/serialization'
import chalk from 'chalk'
import { CreateVideoCategory, ModerateVideoCategories, WorkerGroupLeadRemarked } from '@joystream/metadata-protobuf'
import WorkerGroupLeadRemarkedCommand from '../working-groups/leadRemark'

export default class CreateVideoCategoryCommand extends ContentDirectoryCommandBase {
  static description = 'Create video category inside content directory.'
  static args = [
    {
      name: 'name',
      required: true,
      description: 'Video category name',
    },
  ]
  static flags = {
    ...ContentDirectoryCommandBase.flags,
  }

  async run(): Promise<void> {
    const { name } = this.parse(CreateVideoCategoryCommand).args

    const meta = new WorkerGroupLeadRemarked({
      moderateVideoCategories: new ModerateVideoCategories({
        createCategory: new CreateVideoCategory({
          name,
        }),
      }),
    })
    const metaMessage = metadataToString(WorkerGroupLeadRemarked, meta)

    await WorkerGroupLeadRemarkedCommand.run([
      '--group',
      'curators',
      metaMessage,
    ])

    this.log(chalk.green(`Video category successfully created!`))
  }
}
