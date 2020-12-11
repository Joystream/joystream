import VideoEntitySchema from '@joystream/cd-schemas/schemas/entities/VideoEntity.schema.json'
import { VideoEntity } from '@joystream/cd-schemas/types/entities/VideoEntity'
import { InputParser } from '@joystream/cd-schemas'
import { JSONSchema } from '@apidevtools/json-schema-ref-parser'
import { JsonSchemaCustomPrompts, JsonSchemaPrompter } from '../../helpers/JsonSchemaPrompt'
import { Actor, Entity } from '@joystream/types/content-directory'
import { createType } from '@joystream/types'
import { flags } from '@oclif/command'
import MediaCommandBase from '../../base/MediaCommandBase'

export default class UpdateVideoCommand extends MediaCommandBase {
  static description = 'Update existing video information (requires controller/maintainer access).'
  static flags = {
    // TODO: ...IOFlags, - providing input as json
    asCurator: flags.boolean({
      description: 'Specify in order to update the video as curator',
      required: false,
    }),
  }

  static args = [
    {
      name: 'id',
      description: 'ID of the Video to update',
      required: false,
    },
  ]

  async run() {
    const {
      args: { id },
      flags: { asCurator },
    } = this.parse(UpdateVideoCommand)

    const account = await this.getRequiredSelectedAccount()

    let memberId: number | undefined, actor: Actor

    if (asCurator) {
      actor = await this.getCuratorContext(['Video'])
    } else {
      memberId = await this.getRequiredMemberId()
      actor = createType('Actor', { Member: memberId })
    }

    await this.requestAccountDecoding(account)

    let videoEntity: Entity, videoId: number
    if (id) {
      videoId = parseInt(id)
      videoEntity = await this.getEntity(videoId, 'Video', memberId)
    } else {
      const [id, video] = await this.promptForEntityEntry('Select a video to update', 'Video', 'title', memberId)
      videoId = id.toNumber()
      videoEntity = video
    }

    const currentValues = await this.parseToKnownEntityJson<VideoEntity>(videoEntity)
    const videoJsonSchema = (VideoEntitySchema as unknown) as JSONSchema

    const {
      language: currLanguageId,
      category: currCategoryId,
      publishedBeforeJoystream: currPublishedBeforeJoystream,
    } = currentValues

    const customizedPrompts: JsonSchemaCustomPrompts<VideoEntity> = [
      [
        'language',
        () => this.promptForEntityId('Choose Video language', 'Language', 'name', undefined, currLanguageId),
      ],
      [
        'category',
        () => this.promptForEntityId('Choose Video category', 'ContentCategory', 'name', undefined, currCategoryId),
      ],
      ['publishedBeforeJoystream', () => this.promptForPublishedBeforeJoystream(currPublishedBeforeJoystream)],
    ]
    const videoPrompter = new JsonSchemaPrompter<VideoEntity>(videoJsonSchema, currentValues, customizedPrompts)

    // Prompt for other video data
    const updatedProps: Partial<VideoEntity> = await videoPrompter.promptMultipleProps([
      'language',
      'category',
      'title',
      'description',
      'thumbnailUrl',
      'duration',
      'isPublic',
      'isExplicit',
      'hasMarketing',
      'publishedBeforeJoystream',
      'skippableIntroDuration',
    ])

    if (asCurator) {
      updatedProps.isCensored = await videoPrompter.promptSingleProp('isCensored')
    }

    this.jsonPrettyPrint(JSON.stringify(updatedProps))

    // Parse inputs into operations and send final extrinsic
    const inputParser = InputParser.createWithKnownSchemas(this.getOriginalApi())
    const videoUpdateOperations = await inputParser.getEntityUpdateOperations(updatedProps, 'Video', videoId)
    await this.sendAndFollowNamedTx(account, 'contentDirectory', 'transaction', [actor, videoUpdateOperations], true)
  }
}
