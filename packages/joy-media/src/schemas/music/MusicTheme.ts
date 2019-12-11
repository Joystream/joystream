
/** This file is generated based on JSON schema. Do not modify. */

import * as Yup from 'yup';

export const MusicThemeValidationSchema = Yup.object().shape({
  theme: Yup.string()
    .required('This field is required')
    .max(100, 'Text is too long. Maximum length is 100 chars.')
});

export type MusicThemeType = {
  theme: string
};

export const MusicThemeClass = {
  theme: {
    "name": "Theme",
    "description": "Themes for music.",
    "required": true,
    "type": "Text",
    "maxTextLength": 100
  }
};
