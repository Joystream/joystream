import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import { InputParser } from '@joystream/cd-schemas'
import { flags } from '@oclif/command'
import { ChannelEntity } from '@joystream/cd-schemas/types/entities/ChannelEntity'
import { VideoEntity } from '@joystream/cd-schemas/types/entities/VideoEntity'

const CLASSES = ['Channel', 'Video'] as const
const STATUSES = ['Accepted', 'Censored'] as const

export default class CurateContentCommand extends ContentDirectoryCommandBase {
  static description = `Set the curation status of given entity (${CLASSES.join('/')}). Requires Curator access.`
  static flags = {
    className: flags.enum({
      options: [...CLASSES],
      description: `Name of the class of the entity to curate (${CLASSES.join('/')})`,
      char: 'c',
      required: true,
    }),
    status: flags.enum({
      description: `Specifies the curation status (${STATUSES.join('/')})`,
      char: 's',
      options: [...STATUSES],
      required: true,
    }),
    id: flags.integer({
      description: 'ID of the entity to curate',
      required: true,
    }),
  }

  async run() {
    const { className, status, id } = this.parse(CurateContentCommand).flags

    const account = await this.getRequiredSelectedAccount()
    // Get curator actor with required maintainer access to $className (Video/Channel) class
    const actor = await this.getCuratorContext([className])

    await this.requestAccountDecoding(account)

    const inputParser = InputParser.createWithKnownSchemas(this.getOriginalApi())

    await this.getEntity(id, className) // Check if entity exists and is of given class

    const entityUpdateInput: Partial<ChannelEntity & VideoEntity> = {
      isCensored: status === 'Censored',
    }

    this.log(`Updating the ${className} with:`)
    this.jsonPrettyPrint(JSON.stringify(entityUpdateInput))
    const confirmed = await this.simplePrompt({ type: 'confirm', message: 'Do you confirm the provided input?' })

    if (confirmed) {
      const operations = await inputParser.getEntityUpdateOperations(entityUpdateInput, className, id)
      await this.sendAndFollowNamedTx(account, 'contentDirectory', 'transaction', [actor, operations], true)
    }
  }
}
