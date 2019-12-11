
/** This file is generated based on JSON schema. Do not modify. */

import * as Yup from 'yup';

export const MusicMoodValidationSchema = Yup.object().shape({
  mood: Yup.string()
    .required('This field is required')
    .max(100, 'Text is too long. Maximum length is 100 chars.')
});

export type MusicMoodType = {
  mood: string
};

export const MusicMoodClass = {
  mood: {
    "name": "Mood",
    "description": "Moods for music.",
    "required": true,
    "type": "Text",
    "maxTextLength": 100
  }
};
