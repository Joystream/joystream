import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import { metadataToString } from '../../helpers/serialization'
import chalk from 'chalk'
import { DeleteVideoCategory, ModerateVideoCategories, WorkerGroupLeadRemarked } from '@joystream/metadata-protobuf'
import WorkerGroupLeadRemarkedCommand from '../working-groups/leadRemark'

export default class DeleteVideoCategoryCommand extends ContentDirectoryCommandBase {
  static description = 'Delete video category from content directory.'
  static args = [
    {
      name: 'videoCategoryId',
      required: true,
      description: 'Video category id',
    },
  ]

  static flags = {
    ...ContentDirectoryCommandBase.flags,
  }

  async run(): Promise<void> {
    const { videoCategoryId } = this.parse(DeleteVideoCategoryCommand).args

    const meta = new WorkerGroupLeadRemarked({
      moderateVideoCategories: new ModerateVideoCategories({
        deleteCategory: new DeleteVideoCategory({
          videoCategoryId,
        }),
      }),
    })
    const metaMessage = metadataToString(WorkerGroupLeadRemarked, meta)

    await WorkerGroupLeadRemarkedCommand.run(['--group', 'curators', metaMessage])

    this.log(chalk.green(`Video category successfully deleted!`))
  }
}
