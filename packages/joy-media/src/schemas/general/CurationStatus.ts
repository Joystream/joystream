
/** This file is generated based on JSON schema. Do not modify. */

import * as Yup from 'yup';

export const CurationStatusValidationSchema = Yup.object().shape({
  status: Yup.string()
    .required('This field is required')
    .max(255, 'Text is too long. Maximum length is 255 chars.')
});

export type CurationStatusType = {
  status: string
};

export const CurationStatusClass = {
  status: {
    "name": "Status",
    "description": "The curator publication status of the content in the content directory.",
    "required": true,
    "type": "Text",
    "maxTextLength": 255
  }
};
