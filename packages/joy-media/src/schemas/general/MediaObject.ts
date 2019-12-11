
/** This file is generated based on JSON schema. Do not modify. */

import * as Yup from 'yup';

export const MediaObjectValidationSchema = Yup.object().shape({
  object: Yup.string()
    .required('This field is required')
    .max(68, 'Text is too long. Maximum length is 68 chars.')
});

export type MediaObjectType = {
  object: string
};

export const MediaObjectClass = {
  object: {
    "name": "Object",
    "description": "ContentId of object in the data directory",
    "type": "Text",
    "required": true,
    "maxTextLength": 68
  }
};
