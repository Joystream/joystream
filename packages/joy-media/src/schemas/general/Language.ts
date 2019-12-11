
/** This file is generated based on JSON schema. Do not modify. */

import * as Yup from 'yup';

export const LanguageValidationSchema = Yup.object().shape({
  languageCode: Yup.string()
    .required('This field is required')
    .max(2, 'Text is too long. Maximum length is 2 chars.')
});

export type LanguageType = {
  languageCode: string
};

export const LanguageClass = {
  languageCode: {
    "name": "Language code",
    "description": "Language code following the ISO 639-1 two letter standard.",
    "type": "Text",
    "required": true,
    "maxTextLength": 2
  }
};
