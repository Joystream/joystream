
/** This file is generated based on JSON schema. Do not modify. */

import * as Yup from 'yup';
import { EntityCodec } from '@joystream/types/versioned-store/EntityCodec';

export const PublicationStatusValidationSchema = Yup.object().shape({
  value: Yup.string()
    .required('This field is required')
    .max(50, 'Text is too long. Maximum length is 50 chars.')
});

export type PublicationStatusFormValues = {
  value: string
};

export type PublicationStatusType = {
  id: number
  value: string
};

export class PublicationStatusCodec extends EntityCodec<PublicationStatusType> { }

export function PublicationStatusToFormValues(entity?: PublicationStatusType): PublicationStatusFormValues {
  return {
    value: entity && entity.value || ''
  }
}

export type PublicationStatusPropId =
  'value'
  ;

export type PublicationStatusGenericProp = {
  id: PublicationStatusPropId,
  type: string,
  name: string,
  description?: string,
  required?: boolean,
  maxItems?: number,
  maxTextLength?: number,
  classId?: any
};

type PublicationStatusClassType = {
  [id in PublicationStatusPropId]: PublicationStatusGenericProp
};

export const PublicationStatusClass: PublicationStatusClassType = {
  value: {
    "id": "value",
    "name": "Value",
    "description": "The publication status of the content in the content directory.",
    "required": true,
    "type": "Text",
    "maxTextLength": 50
  }
};
