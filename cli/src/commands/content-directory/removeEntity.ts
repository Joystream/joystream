import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import { Actor } from '@joystream/types/content-directory'
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
    const actor: Actor = await this.getActor(context, entityClass)
    if (!actor.isOfType('Curator') && !this.isActorEntityController(actor, entity, false)) {
      this.error('You are not the entity controller!', { exit: ExitCodes.AccessDenied })
    }

    await this.requireConfirmation(
      `Are you sure you want to remove entity ${id} of class ${entityClass.name.toString()}?`
    )
    await this.requestAccountDecoding(account)

    await this.sendAndFollowNamedTx(account, 'contentDirectory', 'removeEntity', [actor, id])
  }
}
