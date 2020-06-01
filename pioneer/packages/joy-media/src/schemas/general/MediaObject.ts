
/** This file is generated based on JSON schema. Do not modify. */

import * as Yup from 'yup';
import { EntityCodec } from '@joystream/types/versioned-store/EntityCodec';

export const MediaObjectValidationSchema = Yup.object().shape({
  value: Yup.string()
    .required('This field is required')
    .max(66, 'Text is too long. Maximum length is 66 chars.')
});

export type MediaObjectFormValues = {
  value: string
};

export type MediaObjectType = {
  classId: number
  inClassSchemaIndexes: number[]
  id: number
  value: string
};

export class MediaObjectCodec extends EntityCodec<MediaObjectType> { }

export function MediaObjectToFormValues(entity?: MediaObjectType): MediaObjectFormValues {
  return {
    value: entity && entity.value || ''
  }
}

export type MediaObjectPropId =
  'value'
  ;

export type MediaObjectGenericProp = {
  id: MediaObjectPropId,
  type: string,
  name: string,
  description?: string,
  required?: boolean,
  maxItems?: number,
  maxTextLength?: number,
  classId?: any
};

type MediaObjectClassType = {
  [id in MediaObjectPropId]: MediaObjectGenericProp
};

export const MediaObjectClass: MediaObjectClassType = {
  value: {
    "id": "value",
    "name": "Value",
    "description": "Content id of object in the data directory.",
    "type": "Text",
    "required": true,
    "maxTextLength": 48
  }
};
