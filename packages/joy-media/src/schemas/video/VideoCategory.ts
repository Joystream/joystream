
/** This file is generated based on JSON schema. Do not modify. */

import * as Yup from 'yup';

export const VideoCategoryValidationSchema = Yup.object().shape({
  category: Yup.string()
    .required('This field is required')
    .max(255, 'Text is too long. Maximum length is 255 chars.')
});

export type VideoCategoryType = {
  category: string
};

export const VideoCategoryClass = {
  category: {
    "name": "Category",
    "description": "Categories for videos.",
    "type": "Text",
    "required": true,
    "maxTextLength": 255
  }
};
