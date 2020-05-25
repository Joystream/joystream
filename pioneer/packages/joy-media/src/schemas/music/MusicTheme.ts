
/** This file is generated based on JSON schema. Do not modify. */

import * as Yup from 'yup';
import { EntityCodec } from '@joystream/types/lib/versioned-store/EntityCodec';

export const MusicThemeValidationSchema = Yup.object().shape({
  value: Yup.string()
    .required('This field is required')
    .max(100, 'Text is too long. Maximum length is 100 chars.')
});

export type MusicThemeFormValues = {
  value: string
};

export type MusicThemeType = {
  classId: number
  inClassSchemaIndexes: number[]
  id: number
  value: string
};

export class MusicThemeCodec extends EntityCodec<MusicThemeType> { }

export function MusicThemeToFormValues(entity?: MusicThemeType): MusicThemeFormValues {
  return {
    value: entity && entity.value || ''
  }
}

export type MusicThemePropId =
  'value'
  ;

export type MusicThemeGenericProp = {
  id: MusicThemePropId,
  type: string,
  name: string,
  description?: string,
  required?: boolean,
  maxItems?: number,
  maxTextLength?: number,
  classId?: any
};

type MusicThemeClassType = {
  [id in MusicThemePropId]: MusicThemeGenericProp
};

export const MusicThemeClass: MusicThemeClassType = {
  value: {
    "id": "value",
    "name": "Value",
    "description": "Themes for music.",
    "required": true,
    "type": "Text",
    "maxTextLength": 100
  }
};
