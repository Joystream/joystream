
/** This file is generated based on JSON schema. Do not modify. */

import * as Yup from 'yup';
import { EntityCodec } from '@joystream/types/versioned-store/EntityCodec';

export const LanguageValidationSchema = Yup.object().shape({
  languageCode: Yup.string()
    .required('This field is required')
    .max(2, 'Text is too long. Maximum length is 2 chars.')
});

export type LanguageFormValues = {
  languageCode: string
};

export type LanguageType = {
  languageCode: string
};

export class LanguageCodec extends EntityCodec<LanguageType> { }

export type LanguagePropId =
  'languageCode'
  ;

export type LanguageGenericProp = {
  id: LanguagePropId,
  type: string,
  name: string,
  description?: string,
  required?: boolean,
  maxItems?: number,
  maxTextLength?: number,
  classId?: any
};

type LanguageClassType = {
  [id in LanguagePropId]: LanguageGenericProp
};

export const LanguageClass: LanguageClassType = {
  languageCode: {
    "id": "languageCode",
    "name": "Language Code",
    "description": "Language code following the ISO 639-1 two letter standard.",
    "type": "Text",
    "required": true,
    "maxTextLength": 2
  }
};
