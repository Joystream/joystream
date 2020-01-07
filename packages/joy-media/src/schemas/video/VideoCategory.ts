
/** This file is generated based on JSON schema. Do not modify. */

import * as Yup from 'yup';
import { EntityCodec } from '@joystream/types/versioned-store/EntityCodec';

export const VideoCategoryValidationSchema = Yup.object().shape({
  value: Yup.string()
    .required('This field is required')
    .max(255, 'Text is too long. Maximum length is 255 chars.')
});

export type VideoCategoryFormValues = {
  value: string
};

export type VideoCategoryType = {
  value: string
};

export class VideoCategoryCodec extends EntityCodec<VideoCategoryType> { }

export type VideoCategoryPropId =
  'value'
  ;

export type VideoCategoryGenericProp = {
  id: VideoCategoryPropId,
  type: string,
  name: string,
  description?: string,
  required?: boolean,
  maxItems?: number,
  maxTextLength?: number,
  classId?: any
};

type VideoCategoryClassType = {
  [id in VideoCategoryPropId]: VideoCategoryGenericProp
};

export const VideoCategoryClass: VideoCategoryClassType = {
  value: {
    "id": "value",
    "name": "Value",
    "description": "Categories for videos.",
    "type": "Text",
    "required": true,
    "maxTextLength": 255
  }
};
