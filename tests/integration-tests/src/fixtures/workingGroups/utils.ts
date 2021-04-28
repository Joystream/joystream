import { OpeningMetadata } from '@joystream/metadata-protobuf'
import { ApplicationFormQuestionType } from '../../graphql/generated/schema'

export const queryNodeQuestionTypeToMetadataQuestionType = (
  type: ApplicationFormQuestionType
): OpeningMetadata.ApplicationFormQuestion.InputType => {
  if (type === ApplicationFormQuestionType.Text) {
    return OpeningMetadata.ApplicationFormQuestion.InputType.TEXT
  }

  return OpeningMetadata.ApplicationFormQuestion.InputType.TEXTAREA
}
