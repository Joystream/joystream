import { OpeningMetadata } from '@joystream/metadata-protobuf'
import { ApplicationFormQuestionType } from '../../graphql/generated/schema'

type InputTypeMap = OpeningMetadata.ApplicationFormQuestion.InputTypeMap
const InputType = OpeningMetadata.ApplicationFormQuestion.InputType

export const queryNodeQuestionTypeToMetadataQuestionType = (
  type: ApplicationFormQuestionType
): InputTypeMap[keyof InputTypeMap] => {
  if (type === ApplicationFormQuestionType.Text) {
    return InputType.TEXT
  }

  return InputType.TEXTAREA
}
