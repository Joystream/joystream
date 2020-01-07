
/** This file is generated based on JSON schema. Do not modify. */

import * as Yup from 'yup';
import { EntityCodec } from '@joystream/types/versioned-store/EntityCodec';

export const MusicMoodValidationSchema = Yup.object().shape({
  value: Yup.string()
    .required('This field is required')
    .max(100, 'Text is too long. Maximum length is 100 chars.')
});

export type MusicMoodFormValues = {
  value: string
};

export type MusicMoodType = {
  value: string
};

export class MusicMoodCodec extends EntityCodec<MusicMoodType> { }

export type MusicMoodPropId =
  'value'
  ;

export type MusicMoodGenericProp = {
  id: MusicMoodPropId,
  type: string,
  name: string,
  description?: string,
  required?: boolean,
  maxItems?: number,
  maxTextLength?: number,
  classId?: any
};

type MusicMoodClassType = {
  [id in MusicMoodPropId]: MusicMoodGenericProp
};

export const MusicMoodClass: MusicMoodClassType = {
  value: {
    "id": "value",
    "name": "Value",
    "description": "Moods for music.",
    "required": true,
    "type": "Text",
    "maxTextLength": 100
  }
};
