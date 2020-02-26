
/** This file is generated based on JSON schema. Do not modify. */

import * as Yup from 'yup';
import { EntityCodec } from '@joystream/types/versioned-store/EntityCodec';

export const ContentLicenseValidationSchema = Yup.object().shape({
  value: Yup.string()
    .required('This field is required')
    .max(200, 'Text is too long. Maximum length is 200 chars.')
});

export type ContentLicenseFormValues = {
  value: string
};

export type ContentLicenseType = {
  classId: number
  inClassSchemaIndexes: number[]
  id: number
  value: string
};

export class ContentLicenseCodec extends EntityCodec<ContentLicenseType> { }

export function ContentLicenseToFormValues(entity?: ContentLicenseType): ContentLicenseFormValues {
  return {
    value: entity && entity.value || ''
  }
}

export type ContentLicensePropId =
  'value'
  ;

export type ContentLicenseGenericProp = {
  id: ContentLicensePropId,
  type: string,
  name: string,
  description?: string,
  required?: boolean,
  maxItems?: number,
  maxTextLength?: number,
  classId?: any
};

type ContentLicenseClassType = {
  [id in ContentLicensePropId]: ContentLicenseGenericProp
};

export const ContentLicenseClass: ContentLicenseClassType = {
  value: {
    "id": "value",
    "name": "Value",
    "description": "The license of which the content is originally published under.",
    "type": "Text",
    "required": true,
    "maxTextLength": 200
  }
};
