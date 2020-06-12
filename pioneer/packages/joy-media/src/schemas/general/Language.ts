
/** This file is generated based on JSON schema. Do not modify. */

import * as Yup from 'yup';
import { EntityCodec } from '@joystream/types/versioned-store/EntityCodec';

export const LanguageValidationSchema = Yup.object().shape({
  value: Yup.string()
    .required('This field is required')
    .max(2, 'Text is too long. Maximum length is 2 chars.')
});

export type LanguageFormValues = {
  value: string;
};

export type LanguageType = {
  classId: number;
  inClassSchemaIndexes: number[];
  id: number;
  value: string;
};

export class LanguageCodec extends EntityCodec<LanguageType> { }

export function LanguageToFormValues (entity?: LanguageType): LanguageFormValues {
  return {
    value: (entity && entity.value) || ''
  };
}

export type LanguagePropId =
  'value'
  ;

export type LanguageGenericProp = {
  id: LanguagePropId;
  type: string;
  name: string;
  description?: string;
  required?: boolean;
  maxItems?: number;
  maxTextLength?: number;
  classId?: any;
};

type LanguageClassType = {
  [id in LanguagePropId]: LanguageGenericProp
};

export const LanguageClass: LanguageClassType = {
  value: {
    id: 'value',
    name: 'Value',
    description: 'Language code following the ISO 639-1 two letter standard.',
    type: 'Text',
    required: true,
    maxTextLength: 2
  }
};
