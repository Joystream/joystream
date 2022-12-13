import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import { metadataToString } from '../../helpers/serialization'
import chalk from 'chalk'
import { CreateVideoCategory, MemberRemarked } from '@joystream/metadata-protobuf'
import MemberRemarkCommand from '../membership/memberRemark'

export default class CreateVideoCategoryCommand extends ContentDirectoryCommandBase {
  static description = 'Create video category inside content directory.'
  static args = [
    {
      name: 'name',
      required: true,
      description: 'Video category name',
    },
    {
      name: 'description',
      required: false,
      description: 'Video category description',
    },
    {
      name: 'parentCategoryId',
      required: false,
      description: 'Parent category ID',
    },
  ]

  static flags = {
    ...ContentDirectoryCommandBase.flags,
  }

  async run(): Promise<void> {
    const { name, description, parentCategoryId } = this.parse(CreateVideoCategoryCommand).args

    const meta = new MemberRemarked({
      createVideoCategory: new CreateVideoCategory({
        name,
        description,
        parentCategoryId,
      }),
    })
    const metaMessage = metadataToString(MemberRemarked, meta)

    await MemberRemarkCommand.run([metaMessage])

    this.log(chalk.green(`Video category successfully created!`))
  }
}
