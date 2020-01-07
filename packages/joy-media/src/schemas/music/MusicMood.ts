
/** This file is generated based on JSON schema. Do not modify. */

import * as Yup from 'yup';
import { EntityCodec } from '@joystream/types/versioned-store/EntityCodec';

export const MusicMoodValidationSchema = Yup.object().shape({
  mood: Yup.string()
    .required('This field is required')
    .max(100, 'Text is too long. Maximum length is 100 chars.')
});

export type MusicMoodFormValues = {
  mood: string
};

export type MusicMoodType = {
  mood: string
};

export class MusicMoodCodec extends EntityCodec<MusicMoodType> { }

export type MusicMoodPropId =
  'mood'
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
  mood: {
    "id": "mood",
    "name": "Mood",
    "description": "Moods for music.",
    "required": true,
    "type": "Text",
    "maxTextLength": 100
  }
};
