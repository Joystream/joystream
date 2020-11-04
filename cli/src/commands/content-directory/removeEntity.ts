import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import { Actor } from '@joystream/types/content-directory'
import { createType } from '@joystream/types'
import ExitCodes from '../../ExitCodes'

export default class RemoveEntityCommand extends ContentDirectoryCommandBase {
  static description = 'Removes a single entity by id (can be executed in Member, Curator or Lead context)'
  static flags = {
    context: ContentDirectoryCommandBase.contextFlag,
  }

  static args = [
    {
      name: 'id',
      required: true,
      description: 'ID of the entity to remove',
    },
  ]

  async run() {
    let {
      args: { id },
      flags: { context },
    } = this.parse(RemoveEntityCommand)

    const entity = await this.getEntity(id, undefined, undefined, false)
    const [, entityClass] = await this.classEntryByNameOrId(entity.class_id.toString())

    if (!context) {
      context = await this.promptForContext()
    }

    const account = await this.getRequiredSelectedAccount()
    let actor: Actor
    if (context === 'Curator') {
      actor = await this.getCuratorContext([entityClass.name.toString()])
    } else if (context === 'Member') {
      const memberId = await this.getRequiredMemberId()
      if (
        !entity.entity_permissions.controller.isOfType('Member') ||
        entity.entity_permissions.controller.asType('Member').toNumber() !== memberId
      ) {
        this.error('You are not the entity controller!', { exit: ExitCodes.AccessDenied })
      }
      actor = createType('Actor', { Member: memberId })
    } else {
      actor = createType('Actor', { Lead: null })
    }

    await this.requireConfirmation(
      `Are you sure you want to remove entity ${id} of class ${entityClass.name.toString()}?`
    )
    await this.requestAccountDecoding(account)

    await this.sendAndFollowNamedTx(account, 'contentDirectory', 'removeEntity', [actor, id])
  }
}
