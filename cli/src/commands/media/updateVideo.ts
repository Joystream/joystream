import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import VideoEntitySchema from 'cd-schemas/schemas/entities/VideoEntity.schema.json'
import { VideoEntity } from 'cd-schemas/types/entities/VideoEntity'
import { LicenseEntity } from 'cd-schemas/types/entities/LicenseEntity'
import { InputParser } from 'cd-schemas'
import { JSONSchema } from '@apidevtools/json-schema-ref-parser'
import { JsonSchemaCustomPrompts, JsonSchemaPrompter } from '../../helpers/JsonSchemaPrompt'

export default class UpdateVideoCommand extends ContentDirectoryCommandBase {
  static description = 'Update existing video information (requires a membership).'
  // TODO: Id as arg
  static flags = {
    // TODO: ...IOFlags, - providing input as json
  }

  async run() {
    const account = await this.getRequiredSelectedAccount()
    const memberId = await this.getRequiredMemberId()
    const actor = { Member: memberId }

    await this.requestAccountDecoding(account)

    const [videoId, video] = await this.promptForEntityEntry('Select a video to update', 'Video', 'title', memberId)

    const currentValues = await this.parseToKnownEntityJson<VideoEntity>(video)
    const videoJsonSchema = (VideoEntitySchema as unknown) as JSONSchema

    const { language: currLanguageId, category: currCategoryId, license: currLicenseId } = currentValues

    const customizedPrompts: JsonSchemaCustomPrompts<VideoEntity> = [
      [
        'language',
        () => this.promptForEntityId('Choose Video language', 'Language', 'name', undefined, currLanguageId),
      ],
      [
        'category',
        () => this.promptForEntityId('Choose Video category', 'ContentCategory', 'name', undefined, currCategoryId),
      ],
    ]
    const videoPrompter = new JsonSchemaPrompter<VideoEntity>(videoJsonSchema, currentValues, customizedPrompts)

    // Updating a license is currently a bit more tricky since it's a nested relation
    const currKnownLicenseId = (await this.getAndParseKnownEntity<LicenseEntity>(currLicenseId)).knownLicense
    const knownLicenseId = await this.promptForEntityId(
      'Choose a license',
      'KnownLicense',
      'code',
      undefined,
      currKnownLicenseId
    )
    const updatedLicense: LicenseEntity = { knownLicense: knownLicenseId }

    // Prompt for other video data
    const updatedProps: Partial<VideoEntity> = await videoPrompter.promptMultipleProps([
      'language',
      'category',
      'title',
      'description',
      'thumbnailURL',
      'duration',
      'isPublic',
      'hasMarketing',
    ])

    this.jsonPrettyPrint(JSON.stringify(updatedProps))

    // Parse inputs into operations and send final extrinsic
    const inputParser = InputParser.createWithKnownSchemas(this.getOriginalApi())
    const videoUpdateOperation = await inputParser.createEntityUpdateOperation(
      updatedProps,
      'Video',
      videoId.toNumber()
    )
    const licenseUpdateOperation = await inputParser.createEntityUpdateOperation(
      updatedLicense,
      'License',
      currentValues.license
    )
    const operations = [videoUpdateOperation, licenseUpdateOperation]
    await this.sendAndFollowNamedTx(account, 'contentDirectory', 'transaction', [actor, operations], true)
  }
}
