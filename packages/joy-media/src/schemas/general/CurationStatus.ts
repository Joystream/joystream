
/** This file is generated based on JSON schema. Do not modify. */

import * as Yup from 'yup';
import { EntityCodec } from '@joystream/types/versioned-store/EntityCodec';

export const CurationStatusValidationSchema = Yup.object().shape({
  value: Yup.string()
    .required('This field is required')
    .max(255, 'Text is too long. Maximum length is 255 chars.')
});

export type CurationStatusFormValues = {
  value: string
};

export type CurationStatusType = {
  id: number
  value: string
};

export class CurationStatusCodec extends EntityCodec<CurationStatusType> { }

export type CurationStatusPropId =
  'value'
  ;

export type CurationStatusGenericProp = {
  id: CurationStatusPropId,
  type: string,
  name: string,
  description?: string,
  required?: boolean,
  maxItems?: number,
  maxTextLength?: number,
  classId?: any
};

type CurationStatusClassType = {
  [id in CurationStatusPropId]: CurationStatusGenericProp
};

export const CurationStatusClass: CurationStatusClassType = {
  value: {
    "id": "value",
    "name": "Value",
    "description": "The curator publication status of the content in the content directory.",
    "required": true,
    "type": "Text",
    "maxTextLength": 255
  }
};
