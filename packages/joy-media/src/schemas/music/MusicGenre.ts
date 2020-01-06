
/** This file is generated based on JSON schema. Do not modify. */

import * as Yup from 'yup';

export const MusicGenreValidationSchema = Yup.object().shape({
  genre: Yup.string()
    .required('This field is required')
    .max(100, 'Text is too long. Maximum length is 100 chars.')
});

export type MusicGenreFormValues = {
  genre: string
};

export type MusicGenreType = {
  genre: string
};

export type MusicGenrePropId =
  'genre'
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
  genre: {
    "id": "genre",
    "name": "Genre",
    "description": "Genres for music.",
    "required": true,
    "type": "Text",
    "maxTextLength": 100
  }
};
