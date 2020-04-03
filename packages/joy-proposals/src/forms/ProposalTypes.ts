
import BN from 'bn.js'
import * as Yup from 'yup'
import { BlockNumber, AccountId } from '@polkadot/types/interfaces'
import { ValidationConstraint } from '@polkadot/joy-utils/ValidationConstraint'

export type ProposalId = BN

export type GenericProposal = {
  title: string
  description: string
}

export type ProposalValidationConstraints = {
  title: ValidationConstraint
  description: ValidationConstraint
}

// TODO extract: this could be a common function.
export const buildValidationSchema = (constraints?: ProposalValidationConstraints) => {

  function textValidation (field: ProposalGenericProp) {
    const constraint = constraints[field.id]
    if (!constraint) {
      return Yup.string()
    }

    const { min, max } = constraint
    return Yup.string()
      .min(min, `${field.name} is too short. Minimum length is ${min} chars.`)
      .max(max, `${field.name} is too long. Maximum length is ${max} chars.`)
  }

  const fields = ProposalFields

  return Yup.object().shape({
    title:
      textValidation(fields.title)
        .required(`${fields.title.name} is required`),
    description:
      textValidation(fields.description)
        .required(`${fields.description.name} is required`),
  });
}

export type ProposalFormValues = {
  title: string
  description: string
};

export type ProposalType = {
  id: number
  title: string
  description: string
};

// export class ProposalCodec {
//   static fromSubstrate(id: ProposalId, sub: Proposal): ProposalType {
//     return {
//       id: id.toNumber(),
//       title: sub.getString('title'),
//       description: sub.getString('description'),
//     }
//   }
// }

export function ProposalToFormValues(entity?: ProposalType): ProposalFormValues {
  return {
    title: entity && entity.title || '',
    description: entity && entity.description || '',
  }
}

export type ProposalPropId =
  'title' |
  'description'

  // TODO Extract EasyGenericProp<PropId -> id: PropId>
export type ProposalGenericProp = {
  id: ProposalPropId,
  type: string,
  name: string,
  description?: string,
  required?: boolean,
}

type ProposalFieldsType = {
  [id in ProposalPropId]: ProposalGenericProp
}

export const ProposalFields: ProposalFieldsType = {
  title: {
    id: 'title',
    name: 'Title',
    description: 'Title of your proposal.',
    type: 'Text', // TODO maybe delete this field: type
    required: true,
  },
  description: {
    id: 'description',
    name: 'Description',
    description: 'Full description of your proposal.',
    type: 'Text', // TODO maybe delete this field: type
    required: true,
  },
}
