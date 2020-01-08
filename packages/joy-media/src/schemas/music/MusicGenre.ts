
/** This file is generated based on JSON schema. Do not modify. */

import * as Yup from 'yup';
import { EntityCodec } from '@joystream/types/versioned-store/EntityCodec';

export const MusicGenreValidationSchema = Yup.object().shape({
  value: Yup.string()
    .required('This field is required')
    .max(100, 'Text is too long. Maximum length is 100 chars.')
});

export type MusicGenreFormValues = {
  value: string
};

export type MusicGenreType = {
  id: number
  value: string
};

export class MusicGenreCodec extends EntityCodec<MusicGenreType> { }

export type MusicGenrePropId =
  'value'
  ;

export type MusicGenreGenericProp = {
  id: MusicGenrePropId,
  type: string,
  name: string,
  description?: string,
  required?: boolean,
  maxItems?: number,
  maxTextLength?: number,
  classId?: any
};

type MusicGenreClassType = {
  [id in MusicGenrePropId]: MusicGenreGenericProp
};

export const MusicGenreClass: MusicGenreClassType = {
  value: {
    "id": "value",
    "name": "Value",
    "description": "Genres for music.",
    "required": true,
    "type": "Text",
    "maxTextLength": 100
  }
};
