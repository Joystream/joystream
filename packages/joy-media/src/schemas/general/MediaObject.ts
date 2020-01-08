
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
  id: number
  value: string
};

export class MediaObjectCodec extends EntityCodec<MediaObjectType> { }

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
    "description": "ContentId of object in the data directory. Hex format expected.",
    "type": "Text",
    "required": true,
    "maxTextLength": 66
  }
};
