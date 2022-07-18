import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import { metadataToString } from '../../helpers/serialization'
import chalk from 'chalk'
import { UpdateVideoCategory, ModerateVideoCategories, WorkerGroupLeadRemarked } from '@joystream/metadata-protobuf'
import WorkerGroupLeadRemarkedCommand from '../working-groups/leadRemark'
import Long from 'long'

export default class UpdateVideoCategoryCommand extends ContentDirectoryCommandBase {
  static description = 'Update video category inside content directory.'
  static args = [
    {
      name: 'videoCategoryId',
      required: true,
      description: 'Video category id',
    }, {
      name: 'name',
      required: true,
      description: 'New video category name',
    },
  ]
  static flags = {
    ...ContentDirectoryCommandBase.flags,
  }

  async run(): Promise<void> {
    const { videoCategoryId, name } = this.parse(UpdateVideoCategoryCommand).args

    const meta = new WorkerGroupLeadRemarked({
      moderateVideoCategories: new ModerateVideoCategories({
        updateCategory: new UpdateVideoCategory({
          videoCategoryId: new Long(videoCategoryId),
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

    this.log(chalk.green(`Video category successfully updated!`))
  }
}
