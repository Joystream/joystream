import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import { CurationStatusEntity } from 'cd-schemas/types/entities/CurationStatusEntity'
import { InputParser } from 'cd-schemas'
import { flags } from '@oclif/command'
import { ChannelEntity } from 'cd-schemas/types/entities/ChannelEntity'
import { VideoEntity } from 'cd-schemas/types/entities/VideoEntity'

const CLASSES = ['Channel', 'Video'] as const
const STATUSES = ['Accepted', 'Rejected'] as const

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
    rationale: flags.string({
      description: 'Optional rationale',
      char: 'r',
      required: false,
    }),
    id: flags.integer({
      description: 'ID of the entity to curate',
      required: true,
    }),
  }

  async run() {
    const { className, status, id, rationale } = this.parse(CurateContentCommand).flags

    const account = await this.getRequiredSelectedAccount()
    // Get curator actor with required maintainer access to $className and 'CurationStatus' classes
    const actor = await this.getCuratorContext([className, 'CurationStatus'])

    await this.requestAccountDecoding(account)

    const inputParser = InputParser.createWithKnownSchemas(this.getOriginalApi())

    await this.getEntity(id, className) // Check if entity exists and is of given class

    // Check if CurationStatus for this entity already exists
    let existingStatusId: number | undefined
    try {
      existingStatusId = await inputParser.findEntityIdByUniqueQuery({ entityId: id }, 'CurationStatus')
    } catch (e) {
      /* Continue */
    }

    if (existingStatusId) {
      const current = await this.getAndParseKnownEntity<CurationStatusEntity>(existingStatusId)
      const statusUpdate: Partial<CurationStatusEntity> = { approved: status === 'Accepted', comment: rationale }

      this.log(`Existing curation status found!`)
      this.jsonPrettyPrint(JSON.stringify(current))
      this.log('It will be updated to...')
      this.jsonPrettyPrint(JSON.stringify({ ...current, ...statusUpdate }))
      const confirmed = await this.simplePrompt({
        type: 'confirm',
        message: `Do you confirm this operation?`,
      })

      if (confirmed) {
        const operations = await inputParser.getEntityUpdateOperations(statusUpdate, 'CurationStatus', existingStatusId)
        await this.sendAndFollowNamedTx(account, 'contentDirectory', 'transaction', [actor, operations], true)
      }
    } else {
      const curationStatus: CurationStatusEntity = {
        entityId: id,
        approved: status === 'Accepted',
        comment: rationale,
      }

      const entityUpdateInput: Partial<ChannelEntity & VideoEntity> = {
        curationStatus: { new: curationStatus },
      }

      this.jsonPrettyPrint(JSON.stringify(curationStatus))
      const confirmed = await this.simplePrompt({ type: 'confirm', message: 'Do you confirm the provided input?' })

      if (confirmed) {
        const operations = await inputParser.getEntityUpdateOperations(entityUpdateInput, className, id)
        await this.sendAndFollowNamedTx(account, 'contentDirectory', 'transaction', [actor, operations], true)
      }
    }
  }
}
