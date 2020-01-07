
/** This file is generated based on JSON schema. Do not modify. */

import * as Yup from 'yup';
import { EntityCodec } from '@joystream/types/versioned-store/EntityCodec';

export const MusicThemeValidationSchema = Yup.object().shape({
  theme: Yup.string()
    .required('This field is required')
    .max(100, 'Text is too long. Maximum length is 100 chars.')
});

export type MusicThemeFormValues = {
  theme: string
};

export type MusicThemeType = {
  theme: string
};

export const MusicThemeCodec = new EntityCodec<MusicThemeType>();

export type MusicThemePropId =
  'theme'
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
  theme: {
    "id": "theme",
    "name": "Theme",
    "description": "Themes for music.",
    "required": true,
    "type": "Text",
    "maxTextLength": 100
  }
};
