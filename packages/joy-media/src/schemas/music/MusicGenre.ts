
/** This file is generated based on JSON schema. Do not modify. */

import * as Yup from 'yup';

export const MusicGenreValidationSchema = Yup.object().shape({
  genre: Yup.string()
    .required('This field is required')
    .max(100, 'Text is too long. Maximum length is 100 chars.')
});

export type MusicGenreType = {
  genre: string
};

export const MusicGenreClass = {
  genre: {
    "name": "Genre",
    "description": "Genres for music.",
    "required": true,
    "type": "Text",
    "maxTextLength": 100
  }
};
