import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import { metadataToString } from '../../helpers/serialization'
import chalk from 'chalk'
import { CreateVideoCategory, MemberRemarked } from '@joystream/metadata-protobuf'

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

    const [memberId, controllerAccount] = await this.getValidatedMemberRemarkParams()
    const meta = new MemberRemarked({
      createVideoCategory: new CreateVideoCategory({
        name,
        description,
        parentCategoryId,
      }),
    })
    const message = metadataToString(MemberRemarked, meta)
    const keypair = await this.getDecodedPair(controllerAccount)
    const result = await this.sendAndFollowNamedTx(keypair, 'members', 'memberRemark', [memberId, message, null])

    const [id] = this.getEvent(result, 'members', 'MemberRemarked').data
    this.log(chalk.green(`Video category ${name} successfully created by member ${id}!`))
  }
}
